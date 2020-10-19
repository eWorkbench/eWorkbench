#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import jwt
from django.conf import settings
from jwt import DecodeError

JWT_URL_PARAM = 'jwt'

PATH_KEY = 'path'
VERIFICATION_TOKEN_KEY = 'jwt_verification_token'
USER_PK_KEY = 'user'
EXPIRY_DATE_KEY = 'exp'
CHECK_PATH_PARAMS_KEY = 'check_params'


class JWTToken:
    algorithms = 'HS256'
    encryption_key = settings.SECRET_KEY

    def __init__(self, token_string: str):
        self.token_string = token_string

    def decode(self) -> 'JWTPayload':
        decoded = jwt.decode(
            jwt=self.token_string,
            key=self.encryption_key,
            algorithms=self.algorithms,
            verify_exp=True,  # verify expiry date ('exp' argument)
        )

        if decoded:
            return JWTPayload(decoded)
        else:
            raise DecodeError('Token could not be decoded.')

    @classmethod
    def encode(cls, payload: 'JWTPayload') -> 'JWTToken':
        token_byte_string = jwt.encode(payload.dict, key=cls.encryption_key, algorithm=cls.algorithms)
        token_string = token_byte_string.decode('utf-8')
        return JWTToken(token_string)


class JWTPayload:
    def __init__(self, payload: dict):
        self.dict = payload

        # required payload
        try:
            self.path = payload.get(PATH_KEY)
            self.user_pk = payload.get(USER_PK_KEY)
            self.verification_token = payload.get(VERIFICATION_TOKEN_KEY)
        except KeyError as err:
            raise DecodeError('Required payload missing from token.', err)

        # optional payload
        self.expiry_date = payload.get(EXPIRY_DATE_KEY, None)
        self.check_path_params = payload.get(CHECK_PATH_PARAMS_KEY, False)

    @classmethod
    def create(cls, path: str, user, exp=None, check_path_params=False, **kwargs) -> 'JWTPayload':
        payload = {
            PATH_KEY: path,
            USER_PK_KEY: user.pk,
            VERIFICATION_TOKEN_KEY: user.userprofile.jwt_verification_token,
        }

        if exp:
            payload[EXPIRY_DATE_KEY] = exp

        if check_path_params:
            payload[CHECK_PATH_PARAMS_KEY] = True

        payload.update(kwargs)

        return cls(payload)
