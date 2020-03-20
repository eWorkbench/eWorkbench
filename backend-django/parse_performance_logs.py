#!/bin/python

import os


# request_time_middleware log structure:
#  0: DEBUG <datetime> ("DEBUG 2019-10-03T08:21:08.280051"),
#  1: response/request ("response"),
#  2: request uuid ("c012c77e-e5b6-11e9-9fb2-0242ac130008"),
#  3: number of logs for that request ("2"),
#  4: request method ("GET"),
#  5: url ("/api/me/"),
#  6: timedelta between first logged message for this request and current message ("0.3091 seconds"),
# --- dynamic part, for responses only:
#  7: user ("by user1"),
#  8: response status ("status 200"),
#  9: bytes sent ("sent 2 bytes"),
# 10: query count ("8 queries"),
# 11: query execution time ("0.0320 seconds")


class ApiLog:
    created_at = None
    log_type = None  # response/request
    request_id = None
    log_count_of_request = 0
    request_method = None  # get/post/options/...
    url = None
    request_execution_time = 0
    additional_data = None

    def parse_from_line(self, line):
        data = line.split(",")

        self.created_at = data[0].split(" ")[1]
        self.log_type = data[1]
        self.request_id = data[2]
        self.log_count_of_request = data[3]
        self.request_method = data[4].strip()
        self.url = data[5].strip()
        self.request_execution_time = float(data[6].strip().split(" ")[0])
        self.additional_data = data[7:]

        return self


class ResponseLog(ApiLog):
    user = None
    status = None
    bytes_sent = 0
    query_count = 0
    query_execution_time = 0.0

    def parse_from_api_log(self, api_log):
        data = self.additional_data.split(',')
        self.user = data[0].strip().split(' ')[1]
        self.status = int(data[1].strip().split(' ')[1])
        bytes_sent_info = data[2].strip().split(' ')

        if self.is_redirect():
            return

        if len(bytes_sent_info) > 1 and "streaming / downloading" not in file_line:
            self.bytes_sent = int(bytes_sent_info[1])

        self.query_count = int(data[10].strip().split(" ")[0])
        self.query_execution_time = float(data[11].strip().split(" ")[0])

        return self

    def is_redirect(self):
        return self.status == 302


def collect_log(log_map, line):
    log = ApiLog().parse_from_line(line)

    if log.log_type.lower() == 'response':
        log = ResponseLog().parse_from_api_log(log)

    if log.request_method.lower() == 'options':
        return

    map_key = log.request_method + " " + log.url
    if map_key not in log_map:
        log_map[map_key] = []

    log_map[map_key].append(log)


def print_averages(log_map):
    averaged_api_calls = {}

    for method_and_url, url_logs in log_map.items():
        sum_execution_time = 0
        sum_bytes_sent = 0
        sum_query_count = 0
        sum_query_execution_time = 0

        max_execution_time = float("-inf")
        min_execution_time = float("inf")

        for log in url_logs:
            max_execution_time = max(log.request_execution_time, max_execution_time)
            min_execution_time = min(log.request_execution_time, min_execution_time)

            sum_execution_time += log.request_execution_time
            sum_bytes_sent += log.bytes_sent if hasattr(log, 'bytes_sent') else 0
            sum_query_count += log.query_count if hasattr(log, 'query_count') else 0
            sum_query_execution_time += log.query_execution_time if hasattr(log, 'query_execution_time') else 0

        averaged_api_calls[method_and_url] = {
            'num_samples': len(url_logs),
            'avg_bytes': sum_bytes_sent / len(url_logs),
            # 'avg_queries': collected_queries / len(api_calls),
            'avg_time': sum_execution_time / len(url_logs),
            'max_time': max_execution_time,
            'min_time': min_execution_time,
            'sum_query_count': sum_query_count,
            'sum_query_execution_time': sum_query_execution_time,
        }

        # print as csv
        print("{},{},{},{},{}".format(
            method_and_url,
            averaged_api_calls[method_and_url]['avg_time'],
            max_execution_time,
            min_execution_time,
            len(url_logs),
        ))

        # print(api_call_path, averaged_api_calls[api_call_path])


# --- MAIN ---
log_dir = "app/logs/"
collected_api_calls = {}

for file_name in os.listdir(log_dir):
    full_path = os.path.join(log_dir, file_name)
    if os.path.isfile(full_path) and "request_time_middleware" in file_name:
        with open(full_path, "r") as file:
            while True:
                file_line = file.readline().rstrip()
                if file_line:
                    collect_log(collected_api_calls, file_line)
                else:
                    break

print_averages(collected_api_calls)
