import configparser
import json
import logging
import ssl
import sys
import time

import pika
import requests
from pika import exceptions as pika_exceptions

__all__ = ["DSSFileWatch"]

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.DEBUG)

# uncomment to log to stdout
# handler = logging.StreamHandler(sys.stdout)
handler = logging.FileHandler("file_watch.log")
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter("[%(asctime)s - %(levelname)s]: %(message)s")
handler.setFormatter(formatter)
LOGGER.addHandler(handler)


def fix_messages(messages):
    fixed_messages = []
    for message in messages:
        message_dict = json.loads(message)
        for key, value in message_dict.items():
            path = value.replace("~/", "")
            fixed_message_dict = {"path": path}
            fixed_messages.append(fixed_message_dict)
    return fixed_messages


class DSSFileWatch:
    def __init__(self):
        self.settings = configparser.ConfigParser()
        self.settings.read("settings.ini")
        self.connection = None
        self.channel = None
        self.queue = self.settings["rabbitmq"]["host"]
        self.api_endpoint = self.settings["file_watch"]["api_endpoint"]
        self.api_login_endpoint = self.settings["file_watch"]["api_login_endpoint"]
        self.api_user = self.settings["file_watch"]["api_user"]
        self.api_pass = self.settings["file_watch"]["api_pass"]
        self.api_endpoint_request_interval = self.settings.getint("file_watch", "api_endpoint_request_interval")
        self.message_fetch_size = self.settings.getint("file_watch", "message_fetch_size")

    def setup_dssmq_connection(self):
        context = ssl.create_default_context(cafile=self.settings["ssl"]["ca_cert"])
        context.verify_mode = ssl.CERT_REQUIRED
        credentials = pika.PlainCredentials(
            username=self.settings["rabbitmq"]["user"],
            password=self.settings["rabbitmq"]["password"],
            erase_on_connect=True,
        )
        connection_parameters = pika.ConnectionParameters(
            host=self.settings["rabbitmq"]["host"],
            port=self.settings.getint("rabbitmq", "port"),
            virtual_host=self.settings["rabbitmq"]["virtual_host"],
            credentials=credentials,
            heartbeat=0,
            ssl_options=pika.SSLOptions(context),
        )

        self._connect(connection_parameters)

    def _connect(self, connection_parameters):
        try:
            self.connection = pika.BlockingConnection(connection_parameters)
            self.channel = self.connection.channel()
            LOGGER.info(f"Connected to {self.queue}")
        except pika_exceptions.ConnectionClosed:
            LOGGER.error("Error connecting to {}".format(self.settings["rabbitmq"]["host"]))
            LOGGER.info("Retry connect to {}".format(self.settings["rabbitmq"]["host"]))
            self._connect(connection_parameters)

    def get_message_count(self):
        response = self.channel.queue_declare(
            queue=self.settings["rabbitmq"]["queue"], passive=True, arguments={"x-queue-type": "classic"}
        )
        count = response.method.message_count
        LOGGER.info(f"The are {count} pending messages")
        return count

    def get_n_messages(self, n):
        bodies = []
        delivery_tags = []

        for i in range(0, n):
            (method, header, body) = self.channel.basic_get(self.settings["rabbitmq"]["queue"], auto_ack=False)

            bodies.append(body.decode("utf-8"))
            delivery_tags.append(method.delivery_tag)

        LOGGER.info(f"Fetched {n} messages")
        return bodies, delivery_tags

    def acknowledge_multiple_messages(self, delivery_tags):
        for delivery_tag in delivery_tags:
            self.channel.basic_ack(delivery_tag)

    def api_login(self):
        LOGGER.info(f"Login at {self.api_login_endpoint}")

        payload = {"username": self.api_user, "password": self.api_pass}
        token_request = requests.post(url=self.api_login_endpoint, json=payload)
        return token_request.json()["token"]

    def post_files(self, token):
        while True:
            message_count = self.get_message_count()
            if message_count > 0:
                if self.message_fetch_size < message_count:
                    self.message_fetch_size = self.message_fetch_size
                else:
                    self.message_fetch_size = message_count

                LOGGER.info(f"Try to get {self.message_fetch_size} messages")
                messages, delivery_tags = self.get_n_messages(self.message_fetch_size)

                # temporary fix for messages
                messages = fix_messages(messages)

                try:
                    LOGGER.info(f"Notify {self.api_endpoint} about {self.message_fetch_size} new files")

                    response = requests.post(
                        url=self.api_endpoint,
                        json=messages,
                        headers={"Authorization": f"Token {token}"},
                    )
                    if response.ok:
                        LOGGER.info(f"{self.api_endpoint} response: {response.text}")
                        # response ok means a status code between 200 and 399
                        self.acknowledge_multiple_messages(delivery_tags)

                except requests.RequestException:
                    LOGGER.error("Could not complete request")

                time.sleep(self.api_endpoint_request_interval)
            else:
                LOGGER.info("Wait and check if there are new messages")
                time.sleep(1)


if __name__ == "__main__":
    file_watch = None
    try:
        file_watch = DSSFileWatch()
        file_watch.setup_dssmq_connection()
        token = file_watch.api_login()
        if token:
            file_watch.post_files(token)
    except KeyboardInterrupt:
        LOGGER.info("Close connection to dssmq")
        file_watch.channel.close()
        file_watch.connection.close()
