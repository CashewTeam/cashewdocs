---
title: REST API 教程
date: 2026-09-15 00:00:00 +0800
parent: VoiSona Talk 中文手册
nav_order: 10
---

# REST API 教程

Source: https://manual.voisona.com/en/talk/pc/2b6e9bc7efb18014b922c93fcaa8aac4

REST API 是什么启用 REST API使用 Python 调用 API 的示例完整示例代码获取可用语音库合成语音控制声音表现力精细控制语音属性# **REST API 是什么**

REST API（Representational State Transfer Application Programming Interface，表述性状态转移应用程序接口）是一种允许外部程序访问应用功能的接口。它通过 HTTP 请求和响应进行通信，可以自动执行发送语音合成请求、检查状态和获取结果等任务。

启用 Voisona Talk 中的 REST API 后，可以使用 Python、C++ 或 JavaScript 等编程语言控制语音合成，从而将 VoiSona Talk 的合成声音集成到自己的应用、Web 服务、聊天机器人或游戏中。

下面的教程将介绍如何在 VoiSona Talk 中启用 REST API，并使用 Python 执行语音合成。

*REST API 功能目前为 Beta 版本。

---

# **启用 REST API**

1. 启动 VoiSona Talk。

1. 如果尚未登录，请先登录：

1. 确认至少已下载一个语音库。

1. 启用 REST API：

---

# **示例：使用 Python 调用 API**

## **完整示例代码**

下面是完整示例代码，后续各节会解释其中的各个部分。

运行示例代码需要安装 requests 软件包：

运行示例：

请根据 API 设置替换用户名和密码。

---

## **获取可用语音库**

可以按以下方式获取已安装语音库的列表：

输出示例：

如果编辑器中没有下载任何语音库，结果将为空。

---

## **合成语音**

以下代码会向 API 服务器发送语音合成请求：

示例代码使用获取到的列表中的第一个语音库进行合成。

合成完成后，你会听到“こんにちは”通过默认音频设备播放。

请注意，服务器对请求数量有限制。达到上限后，请求可能失败。将 `force_enqueue` 设置为 true 会自动删除较早的请求，为新请求腾出空间。

可以使用执行 synthesize_text 函数获得的 UUID 检查已提交请求的状态。

如果 `state` 为 `queued`，表示请求正在等待处理；如果为 `succeeded`，表示合成已成功完成。

也可以指定请求的 UUID 删除请求：

如需将合成结果保存为文件而不是播放，请指定绝对路径：

---

## **控制声音表现力**

如需改变声音表现力，请加入一个 `global_parameters` 对象。例如，要将语速加倍：

---

## **精细控制语音属性**

可以修改分析后的文本数据来进行精细控制。首先发送文本分析请求：

响应示例：

修改分析后的文本并将其发送回服务器，可以调整重音和发音。下面是使用 XML 解析器的示例。

详情请通过 VoiSona Talk 编辑器 Preferences 窗口中 API 标签页的链接，参阅“Talk API Reference”。

---
## 示例代码

```python
import argparse
import json
import os
import sys
import time
import xml.etree.ElementTree as ET
import requests
parser = argparse.ArgumentParser()
parser.add_argument("--user", type=str, required=True, help="User name")
parser.add_argument("--password", type=str, required=True, help="API password")
parser.add_argument("--port", type=int, default=32766, help="Port number")
parser.add_argument("--output-wav", type=str, default="test.wav", help="WAV filename")
args = parser.parse_args()
auth = (args.user, args.password)
base_url = f"http://localhost:{args.port}/api/talk/v1/"
def get_voice_libraries():
    response = requests.get(base_url + "voices", auth=auth)
    response.raise_for_status()
    voice_libraries = response.json()["items"]
    print("The list of available voice libraries is shown below.")
    print(json.dumps(voice_libraries, indent=2, ensure_ascii=False))
    return voice_libraries
def synthesize_text(voice_library):
    payload = {
        "text": "こんにちは",
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
        "force_enqueue": True,
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    uuid = response.json()["uuid"]
    print("Request sent successfully.")
    return uuid
def check_status(uuid, synth=True, timeout=30):
    start = time.time()
    endpoint = "speech-syntheses" if synth else "text-analyses"
    while True:
        response = requests.get(base_url + endpoint + "/" + uuid, auth=auth)
        response.raise_for_status()
        state = response.json()["state"]
        if state == "succeeded":
            break
        if time.time() - start > timeout:
            raise TimeoutError("Processing took too long.")
        time.sleep(0.1)
    print("Request processing completed.")
    return response
def delete_request(uuid):
    response = requests.delete(base_url + "speech-syntheses/" + uuid, auth=auth)
    response.raise_for_status()
    print("Request processing completed.")
def synthesize_text_and_save(voice_library):
    payload = {
        "text": "こんにちは",
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
        "can_overwrite_file": True,
        "destination": "file",
        "output_file_path": os.path.abspath(args.output_wav),
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    uuid = response.json()["uuid"]
    print("Request sent successfully.")
    return uuid
def synthesize_text_with_global_parameters(voice_library):
    payload = {
        "text": "こんにちは",
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
        "global_parameters": {
            "alp": 0.0,
            "huskiness": 0.0,
            "intonation": 1.0,
            "pitch": 0.0,
            "speed": 2.0,
            "style_weights": [],
            "volume": 0.0,
        },
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    uuid = response.json()["uuid"]
    print("Request sent successfully.")
    return uuid
def analyze_text():
    payload = {
        "text": "こんにちは",
        "language": "ja_JP",
    }
    response = requests.post(base_url + "text-analyses", auth=auth, json=payload)
    uuid = response.json()["uuid"]
    response = check_status(uuid, synth=False)
    analyzed_text = response.json()["analyzed_text"]
    print("Text analysis completed.")
    print(analyzed_text)
    return analyzed_text
def synthesize_text_with_analyzed_text(voice_library, analyzed_text):
    root = ET.fromstring(analyzed_text)
    word = root.find(".//word")
    word.set("hl", "hllll")
    word.set("pronunciation", "コンニチハ")
    modified_analyzed_text = ET.tostring(root, encoding="unicode")
    print(modified_analyzed_text)
    payload = {
        "analyzed_text": modified_analyzed_text,
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    uuid = response.json()["uuid"]
    print("Request sent successfully.")
    return uuid
try:
    voice_libraries = get_voice_libraries()
    if len(voice_libraries) == 0:
        print("Please download a voice library.")
        sys.exit(1)
    voice_library = voice_libraries[0]
    uuid = synthesize_text(voice_library)
    check_status(uuid)
    delete_request(uuid)
    uuid = synthesize_text_and_save(voice_library)
    check_status(uuid)
    time.sleep(2)# Wait for the previous audio playback to finish.
    uuid = synthesize_text_with_global_parameters(voice_library)
    check_status(uuid)
    time.sleep(2)# Wait for the previous audio playback to finish.
    analyzed_text = analyze_text()
    uuid = synthesize_text_with_analyzed_text(voice_library, analyzed_text)
    check_status(uuid)
    print("The tutorial was completed without errors.")
except requests.exceptions.ConnectionError as e:
    print("Failed to connect. Please check the server status and configuration.")
    print(e)
except requests.exceptions.HTTPError as e:
    print("An HTTP error occurred.")
    print(e)
except Exception as e:
    print("An unexpected error occurred.")
    print(e)
```

```bash
pip install requests
```

```bash
python sample.py --user hoge@example.com --password 1234
```

```python
auth = (args.user, args.password)
base_url = f"http://localhost:{args.port}/api/talk/v1/"
def get_voice_libraries():
    response = requests.get(base_url + "voices", auth=auth)
    response.raise_for_status()
    voice_libraries = response.json()["items"]
    print("The list of available voice libraries is shown below.")
    print(json.dumps(voice_libraries, indent=2, ensure_ascii=False))
    return voice_libraries
```

```json
[
  {
    "display_names": [
      {
        "language": "ja_JP",
        "name": "田中傘"
      },
      {
        "language": "en_US",
        "name": "Tanaka San"
      }
    ],
    "languages": [
      "ja_JP"
    ],
    "voice_name": "tanaka-san_ja_JP",
    "voice_version": "2.0.0"
  }
]
```

```python
def synthesize_text(voice_library):
    payload = {
        "text": "こんにちは",
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
        "force_enqueue": True,
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    uuid = response.json()["uuid"]
    print("Request sent successfully.")
    return uuid
```

```python
def check_status(uuid, timeout=30):
    start = time.time()
    while True:
        response = requests.get(base_url + "speech-syntheses/" + uuid, auth=auth)
        response.raise_for_status()
        state = response.json()["state"]
        if state == "succeeded":
            break
        if time.time() - start > timeout:
            raise TimeoutError("Processing took too long.")
        time.sleep(0.1)
    print("Request processing completed.")
    return response
```

```python
def delete_request(uuid):
    response = requests.delete(base_url + "speech-syntheses/" + uuid, auth=auth)
    response.raise_for_status()
    print("Request deleted successfully.")
```

```python
def synthesize_text_and_save(voice_library):
    payload = {
        "text": "こんにちは",
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
        "can_overwrite_file": True,
        "destination": "file",
        "output_file_path": os.path.abspath(args.output_wav),
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    print("Request sent successfully.")
```

```python
def synthesize_text_with_global_parameters(voice_library):
    payload = {
        "text": "こんにちは",
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
        "global_parameters": {
            "alp": 0.0,
            "huskiness": 0.0,
            "intonation": 1.0,
            "pitch": 0.0,
            "speed": 2.0,
            "style_weights": [],
            "volume": 0.0,
        },
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    print("Request sent successfully.")
```

```python
def analyze_text():
    payload = {
        "text": "こんにちは",
        "language": "ja_JP",
    }
    response = requests.post(base_url + "text-analyses", auth=auth, json=payload)
    uuid = response.json()["uuid"]
    response = check_status(uuid, synth=False)
    analyzed_text = response.json()["analyzed_text"]
    print("Text analysis completed.")
    print(analyzed_text)
    return analyzed_text
```

```xml
<tsml><acoustic_phrase><word chain="0" hl="lhhhh" original="こんにちは" phoneme="k,o|N|n,i|ch,i|w,a" pos="感動詞" pronunciation="コ
ンニチワ">こんにちは</word></acoustic_phrase></tsml>
```

```python
def synthesize_text_with_analyzed_text(voice_library, analyzed_text):
    root = ET.fromstring(analyzed_text)
    word = root.find(".//word")
    word.set("hl", "hllll")
    word.set("pronunciation", "コンニチハ")
    modified_analyzed_text = ET.tostring(root, encoding="unicode")
    print(modified_analyzed_text)
    payload = {
        "analyzed_text": modified_analyzed_text,
        "language": voice_library["languages"][0],
        "voice_name": voice_library["voice_name"],
        "voice_version": voice_library["voice_version"],
    }
    response = requests.post(base_url + "speech-syntheses", auth=auth, json=payload)
    response.raise_for_status()
    print("Request sent successfully.")
```




