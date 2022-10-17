#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
import random
import time
from pprint import pformat
from uuid import uuid4

from wsgidav import util
from wsgidav.dav_error import HTTP_LOCKED, DAVError, DAVErrorCondition, PRECONDITION_CODE_LockConflict
from wsgidav.rw_lock import ReadWriteLock

from eric.webdav.wsgidav_base_locks import BaseLock

__docformat__ = "reStructuredText"

logger = logging.getLogger(__name__)


class DummyLock(BaseLock):
    def get(self, *args, **kwargs):
        pass

    def acquire(self, *args, **kwargs):
        return str(uuid4())

    def release(self, token):
        return True

    def del_locks(self):
        pass


# ========================================================================
# Tool functions
# ========================================================================


def generate_lock_token():
    return "opaquelocktoken:" + util.to_str(hex(random.getrandbits(256)))


def normalize_lock_root(path):
    # Normalize root: /foo/bar
    assert path
    path = util.to_str(path)
    path = "/" + path.strip("/")
    return path


def is_lock_expired(lock):
    expire = float(lock["expire"])
    return expire >= 0 and expire < time.time()


def lock_string(lock_dict):
    """Return readable rep."""
    if not lock_dict:
        return "Lock: None"

    if lock_dict["expire"] < 0:
        expire = "Infinite ({})".format(lock_dict["expire"])
    else:
        expire = "{} (in {} seconds)".format(util.get_log_time(lock_dict["expire"]), lock_dict["expire"] - time.time())

    return "Lock(<{}..>, '{}', {}, {}, depth-{}, until {}".format(
        # first 4 significant token characters
        lock_dict.get("token", "?" * 30)[18:22],
        lock_dict.get("root"),
        lock_dict.get("principal"),
        lock_dict.get("scope"),
        lock_dict.get("depth"),
        expire,
    )


def validate_lock(lock):
    assert util.is_str(lock["root"])
    assert lock["root"].startswith("/")
    assert lock["type"] == "write"
    assert lock["scope"] in ("shared", "exclusive")
    assert lock["depth"] in ("0", "infinity")
    assert util.is_bytes(lock["owner"]), lock  # XML bytestring
    # raises TypeError:
    timeout = float(lock["timeout"])
    assert timeout > 0 or timeout == -1, "timeout must be positive or -1"
    assert util.is_str(lock["principal"])
    if "token" in lock:
        assert util.is_str(lock["token"])


# ========================================================================
# WsgiDavLock
# ========================================================================
class WsgiDavLock:
    """
    Implements locking functionality using a custom storage layer.

    """

    LOCK_TIME_OUT_DEFAULT = 604800  # 1 week, in seconds

    def __init__(self, storage):
        """
        storage:
            LockManagerStorage object
        """
        assert hasattr(storage, "get_lock_list")
        self._lock = ReadWriteLock()
        self.storage = storage
        self.storage.open()

    def __del__(self):
        self.storage.close()

    def __repr__(self):
        return f"{self.__class__.__name__}({self.storage!r})"

    def _dump(self, msg=""):
        urlDict = {}  # { <url>: [<tokenlist>] }
        ownerDict = {}  # { <LOCKOWNER>: [<tokenlist>] }
        userDict = {}  # { <LOCKUSER>: [<tokenlist>] }
        tokenDict = {}  # { <token>: <LOCKURLS> }

        logger.info(f"{self}: {msg}")

        for lock in self.storage.get_lock_list("/", include_root=True, include_children=True, token_only=False):
            tok = lock["token"]
            tokenDict[tok] = lock_string(lock)
            userDict.setdefault(lock["principal"], []).append(tok)
            ownerDict.setdefault(lock["owner"], []).append(tok)
            urlDict.setdefault(lock["root"], []).append(tok)

        logger.info(f"Locks:\n{pformat(tokenDict, indent=0, width=255)}")
        if tokenDict:
            logger.info(f"Locks by URL:\n{pformat(urlDict, indent=4, width=255)}")
            logger.info(f"Locks by principal:\n{pformat(userDict, indent=4, width=255)}")
            logger.info(f"Locks by owner:\n{pformat(ownerDict, indent=4, width=255)}")

    def _generate_lock(self, principal, lock_type, lock_scope, lock_depth, lock_owner, path, timeout):
        """Acquire lock and return lock_dict.

        principal
            Name of the principal.
        lock_type
            Must be 'write'.
        lock_scope
            Must be 'shared' or 'exclusive'.
        lock_depth
            Must be '0' or 'infinity'.
        lock_owner
            String identifying the owner.
        path
            Resource URL.
        timeout
            Seconds to live

        This function does NOT check, if the new lock creates a conflict!
        """
        if timeout is None:
            timeout = WsgiDavLock.LOCK_TIME_OUT_DEFAULT
        elif timeout < 0:
            timeout = -1

        lock_dict = {
            "root": path,
            "type": lock_type,
            "scope": lock_scope,
            "depth": lock_depth,
            "owner": lock_owner,
            "timeout": timeout,
            "principal": principal,
        }
        #
        self.storage.create(path, lock_dict)
        return lock_dict

    def acquire(
        self,
        *,
        url,
        lock_type,
        lock_scope,
        lock_depth,
        lock_owner,
        timeout,
        principal,
        token_list,
    ):
        """Check for permissions and acquire a lock.

        On success return new lock dictionary.
        On error raise a DAVError with an embedded DAVErrorCondition.
        """
        url = normalize_lock_root(url)
        self._lock.acquire_write()
        try:
            # Raises DAVError on conflict:
            self._check_lock_permission(url, lock_type, lock_scope, lock_depth, token_list, principal)
            return self._generate_lock(principal, lock_type, lock_scope, lock_depth, lock_owner, url, timeout)
        finally:
            self._lock.release()

    def refresh(self, token, *, timeout=None):
        """Set new timeout for lock, if existing and valid."""
        if timeout is None:
            timeout = WsgiDavLock.LOCK_TIME_OUT_DEFAULT
        return self.storage.refresh(token, timeout=timeout)

    def get_lock(self, token, *, key=None):
        """Return lock_dict, or None, if not found or invalid.

        Side effect: if lock is expired, it will be purged and None is returned.

        key:
            name of lock attribute that will be returned instead of a dictionary.
        """
        assert key in (
            None,
            "type",
            "scope",
            "depth",
            "owner",
            "root",
            "timeout",
            "principal",
            "token",
        )
        lock = self.storage.get(token)
        if key is None or lock is None:
            return lock
        return lock[key]

    def release(self, token):
        """Delete lock."""
        self.storage.delete(token)

    def is_token_locked_by_user(self, token, principal):
        """Return True, if <token> exists, is valid, and bound to <principal>."""
        return self.get_lock(token, key="principal") == principal

    def get_url_lock_list(self, url):
        """Return list of lock_dict, if <url> is protected by at least one direct, valid lock.

        Side effect: expired locks for this url are purged.
        """
        url = normalize_lock_root(url)
        lockList = self.storage.get_lock_list(url, include_root=True, include_children=False, token_only=False)
        return lockList

    def get_indirect_url_lock_list(self, url, *, principal=None):
        """Return a list of valid lockDicts, that protect <path> directly or indirectly.

        If a principal is given, only locks owned by this principal are returned.
        Side effect: expired locks for this path and all parents are purged.
        """
        url = normalize_lock_root(url)
        lockList = []
        u = url
        while u:
            lock_list = self.storage.get_lock_list(u, include_root=True, include_children=False, token_only=False)
            for lock in lock_list:
                if u != url and lock["depth"] != "infinity":
                    continue  # We only consider parents with Depth: infinity
                # TODO: handle shared locks in some way?
                #                if (lock["scope"] == "shared" and lock_scope == "shared"
                #                   and principal != lock["principal"]):
                # continue  # Only compatible with shared locks by other users
                if principal is None or principal == lock["principal"]:
                    lockList.append(lock)
            u = util.get_uri_parent(u)
        return lockList

    def is_url_locked(self, url):
        """Return True, if url is directly locked."""
        lockList = self.get_url_lock_list(url)
        return len(lockList) > 0

    def is_url_locked_by_token(self, url, lock_token):
        """Check, if url (or any of it's parents) is locked by lock_token."""
        lockUrl = self.get_lock(lock_token, key="root")
        return lockUrl and util.is_equal_or_child_uri(lockUrl, url)

    def remove_all_locks_from_url(self, url):
        self._lock.acquire_write()
        try:
            lockList = self.get_url_lock_list(url)
            for lock in lockList:
                self.release(lock["token"])
        finally:
            self._lock.release()

    def _check_lock_permission(self, url, lock_type, lock_scope, lock_depth, token_list, principal):
        """Check, if <principal> can lock <url>, otherwise raise an error.

        If locking <url> would create a conflict, DAVError(HTTP_LOCKED) is
        raised. An embedded DAVErrorCondition contains the conflicting resource.

        @see http://www.webdav.org/specs/rfc4918.html#lock-model

        - Parent locks WILL NOT be conflicting, if they are depth-0.
        - Exclusive depth-infinity parent locks WILL be conflicting, even if
          they are owned by <principal>.
        - Child locks WILL NOT be conflicting, if we request a depth-0 lock.
        - Exclusive child locks WILL be conflicting, even if they are owned by
          <principal>. (7.7)
        - It is not enough to check whether a lock is owned by <principal>, but
          also the token must be passed with the request. (Because <principal>
          may run two different applications on his client.)
        - <principal> cannot lock-exclusive, if he holds a parent shared-lock.
          (This would only make sense, if he was the only shared-lock holder.)
        - TODO: litmus tries to acquire a shared lock on one resource twice
          (locks: 27 'double_sharedlock') and fails, when we return HTTP_LOCKED.
          So we allow multi shared locks on a resource even for the same
          principal.

        @param url: URL that shall be locked
        @param lock_type: "write"
        @param lock_scope: "shared"|"exclusive"
        @param lock_depth: "0"|"infinity"
        @param token_list: list of lock tokens, that the user submitted in If: header
        @param principal: name of the principal requesting a lock

        @return: None (or raise)
        """
        assert lock_type == "write"
        assert lock_scope in ("shared", "exclusive")
        assert lock_depth in ("0", "infinity")

        logger.debug(f"checkLockPermission({url}, {lock_scope}, {lock_depth}, {principal})")

        # Error precondition to collect conflicting URLs
        errcond = DAVErrorCondition(PRECONDITION_CODE_LockConflict)

        self._lock.acquire_read()
        try:
            # Check url and all parents for conflicting locks
            u = url
            while u:
                lock_list = self.get_url_lock_list(u)
                for lock in lock_list:
                    logger.debug(f"    check parent {u}, {lock_string(lock)}")
                    if u != url and lock["depth"] != "infinity":
                        # We only consider parents with Depth: infinity
                        continue
                    elif lock["scope"] == "shared" and lock_scope == "shared":
                        # Only compatible with shared locks (even by same
                        # principal)
                        continue
                    # Lock conflict
                    logger.debug(f" -> DENIED due to locked parent {lock_string(lock)}")
                    errcond.add_href(lock["root"])
                u = util.get_uri_parent(u)

            if lock_depth == "infinity":
                # Check child URLs for conflicting locks
                child_ocks = self.storage.get_lock_list(
                    url, include_root=False, include_children=True, token_only=False
                )

                for lock in child_ocks:
                    assert util.is_child_uri(url, lock["root"])
                    #                    if util.is_child_uri(url, lock["root"]):
                    logger.debug(f" -> DENIED due to locked child {lock_string(lock)}")
                    errcond.add_href(lock["root"])
        finally:
            self._lock.release()

        # If there were conflicts, raise HTTP_LOCKED for <url>, and pass
        # conflicting resource with 'no-conflicting-lock' precondition
        if len(errcond.hrefs) > 0:
            raise DAVError(HTTP_LOCKED, err_condition=errcond)
        return

    def check_write_permission(self, *, url, depth, token_list, principal):
        """Check, if <principal> can modify <url>, otherwise raise HTTP_LOCKED.

        If modifying <url> is prevented by a lock, DAVError(HTTP_LOCKED) is
        raised. An embedded DAVErrorCondition contains the conflicting locks.

        <url> may be modified by <principal>, if it is not currently locked
        directly or indirectly (i.e. by a locked parent).
        For depth-infinity operations, <url> also must not have locked children.

        It is not enough to check whether a lock is owned by <principal>, but
        also the token must be passed with the request. Because <principal> may
        run two different applications.

        See http://www.webdav.org/specs/rfc4918.html#lock-model
            http://www.webdav.org/specs/rfc4918.html#rfc.section.7.4

        TODO: verify assumptions:
        - Parent locks WILL NOT be conflicting, if they are depth-0.
        - Exclusive child locks WILL be conflicting, even if they are owned by <principal>.

        @param url: URL that shall be modified, created, moved, or deleted
        @param depth: "0"|"infinity"
        @param token_list: list of lock tokens, that the principal submitted in If: header
        @param principal: name of the principal requesting a lock

        @return: None or raise error
        """
        assert util.is_str(url)
        assert depth in ("0", "infinity")
        logger.debug(f"check_write_permission({url}, {depth}, {token_list}, {principal})")

        # Error precondition to collect conflicting URLs
        errcond = DAVErrorCondition(PRECONDITION_CODE_LockConflict)

        self._lock.acquire_read()
        try:
            # Check url and all parents for conflicting locks
            u = url
            while u:
                lock_list = self.get_url_lock_list(u)
                logger.debug(f"  checking {u}")
                for lock in lock_list:
                    logger.debug(f"     lock={lock_string(lock)}")
                    if u != url and lock["depth"] != "infinity":
                        # We only consider parents with Depth: inifinity
                        continue
                    elif principal == lock["principal"] and lock["token"] in token_list:
                        # User owns this lock
                        continue
                    else:
                        # Token is owned by principal, but not passed with lock list
                        logger.debug(f" -> DENIED due to locked parent {lock_string(lock)}")
                        errcond.add_href(lock["root"])
                u = util.get_uri_parent(u)

            if depth == "infinity":
                # Check child URLs for conflicting locks
                child_ocks = self.storage.get_lock_list(
                    url, include_root=False, include_children=True, token_only=False
                )

                for lock in child_ocks:
                    assert util.is_child_uri(url, lock["root"])
                    #                    if util.is_child_uri(url, lock["root"]):
                    logger.debug(f" -> DENIED due to locked child {lock_string(lock)}")
                    errcond.add_href(lock["root"])
        finally:
            self._lock.release()

        # If there were conflicts, raise HTTP_LOCKED for <url>, and pass
        # conflicting resource with 'no-conflicting-lock' precondition
        if len(errcond.hrefs) > 0:
            raise DAVError(HTTP_LOCKED, err_condition=errcond)
        return
