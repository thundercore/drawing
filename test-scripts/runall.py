import threading
import time
import requests
import json
import random

#################################Pressure Test#################################

howmany = 10
sleep_before_run_range_ms = 120000 # random sleep ms before execute every thread
sleep_between_steps_s = 60
post_timeout_s = None

winnerNumber = 10 # suggestion: less than 100 due to chain gas limitation
userNumber = 1500

###############################################################################

iDrawingUrl = ''
header = {"Content-Type": "application/json", 'Connection':'close'}

###############################################################################

iDrawing_session = requests.Session()

result1234 = []
time_s1 = []
time_s2 = []
time_s3 = []
time_s4 = []
time_s5 = []
result_s1 = [] # contract list
result_s2 = [] # secret list
success_time_s1 = 0
success_time_s2 = 0
success_time_s3 = 0
success_time_s4 = 0
success_time_s5 = 0

# Step 1. Create Drawing
# curl -X POST -H "Content-Type: application/json" https://<Drawing Server>/api/v1/drawing -d '{"name": "iDrawing Test curl", "numberOfWinners": 1}'
def step1_create(num):
    url1 = '{0}/api/v1/drawing'.format(iDrawingUrl)
    data = {"name": "iDrawing Test", "numberOfWinners": winnerNumber}

    # random sleep
    sleep_before_run = round(random.uniform(0,sleep_before_run_range_ms) * 0.001, 3)
    time.sleep(sleep_before_run)

    start_time = time.time()
    res = iDrawing_session.post(url1, data = json.dumps(data), headers = header, timeout=post_timeout_s)
    spend_time = time.time() - start_time

    global time_s1
    global result_s1
    time_s1.append(spend_time)
    print("[Step1] No: {:03d}".format(num+1), "Status:", res.status_code, "Time:", spend_time)

    if res.status_code != 201:
        print(res.text)
        return
    else:
        global success_time_s1
        success_time_s1 += 1
    result_s1.append(res.json()["contractAddress"])

# Step 2. Start Enrollment Process
# curl -X POST -H "Content-Type: application/json" https://<Drawing Server>/api/v1/drawing/<Contract Address>/start -d '{"rules": "Sample iDrawing rule"}'
# Contract Address: Generated by Step1
def step2_start(num, contract_address):
    url1 = '{0}/api/v1/drawing/{1}/start'.format(iDrawingUrl, contract_address)
    data = {"rules": "Sample iDrawing rule"}

    # random sleep
    sleep_before_run = round(random.uniform(0,sleep_before_run_range_ms) * 0.001, 3)
    time.sleep(sleep_before_run)

    start_time = time.time()
    res = iDrawing_session.post(url1, data = json.dumps(data), headers = header, timeout=post_timeout_s)
    spend_time = time.time() - start_time

    global time_s2
    global result_s2
    time_s2.append(spend_time)
    print("[Step2] No: {:03d}".format(num+1), "Status:", res.status_code, "Time:", spend_time)

    if res.status_code != 201:
        print(res.text)
        secret = ""
    else:
        global success_time_s2
        success_time_s2 += 1
        secret = res.json()["secret"]
    result_s2.append({"contract": contract_address, "secret": secret})

# Step 3. Enroll users
# curl -X POST -H "Content-Type: application/json" https://<Drawing Server>/api/v1/drawing/<Contract Address>/users -d '{"users": [100000001,100000002,100000003]}'
def step3_users(num, contract_address):
    url1 = '{0}/api/v1/drawing/{1}/users'.format(iDrawingUrl, contract_address)
    data = {"users": list(range(100000001, 100000001+userNumber))}

    # random sleep
    sleep_before_run = round(random.uniform(0,sleep_before_run_range_ms) * 0.001, 3)
    time.sleep(sleep_before_run)

    start_time = time.time()
    res = iDrawing_session.post(url1, data = json.dumps(data), headers = header, timeout=post_timeout_s)
    spend_time = time.time() - start_time

    global time_s3
    time_s3.append(spend_time)
    print("[Step3] No: {:03d}".format(num+1), "Status:", res.status_code, "Time:", spend_time)

    if res.status_code != 201:
        print(res.text)
        return
    else:
        global success_time_s3
        success_time_s3 += 1

# Step 4. Ends Enrollment Phase
# curl -X POST -H "Content-Type: application/json" https://<Drawing Server>/api/v1/drawing/<Contract Address>/end
def step4_end(num, data):
    contract_address = data['contract']
    secret = data['secret']
    url1 = '{0}/api/v1/drawing/{1}/end'.format(iDrawingUrl, contract_address)
    data = {}

    # random sleep
    sleep_before_run = round(random.uniform(0,sleep_before_run_range_ms) * 0.001, 3)
    time.sleep(sleep_before_run)

    start_time = time.time()
    res = iDrawing_session.post(url1, data = json.dumps(data), headers = header, timeout=post_timeout_s)
    spend_time = time.time() - start_time

    global time_s4
    time_s4.append(spend_time)
    print("[Step4] No: {:03d}".format(num+1), "Status:", res.status_code, "Time:", spend_time)

    if res.status_code != 201:
        print(res.text)
    else:
        global success_time_s4
        success_time_s4 += 1
        result1234.append({"contract": contract_address, "secret": secret})

# Step 5. Reveal Drawing
# curl -X POST -H "Content-Type: application/json" https://<Drawing Server>/api/v1/drawing/<Contract Address>/reveal -d '{"secret": <Secret>}'
# Secret: Generated by Step2
def step5_reveal(num, result1234):
    # random sleep
    # sleep_before_run = round(random.uniform(0,sleep_before_run_range_ms) * 0.001, 3)
    # time.sleep(sleep_before_run)

    contract_address = result1234["contract"]
    secret = result1234["secret"]
    url = '{0}/api/v1/drawing/{1}/reveal'.format(iDrawingUrl, contract_address)
    data = {"secret": secret.split("\n")[0]}

    start_time = time.time()
    res = iDrawing_session.post(url, data = json.dumps(data), headers = header, timeout=post_timeout_s)
    spend_time = time.time() - start_time

    print("[Step5] No:", "{:03d}".format(num+1), "Code:", res.status_code, "time:{:.3f}".format(spend_time), "contract:", contract_address)

    global time_s5
    time_s5.append(spend_time)
    if res.status_code != 201:
        print(res.text)
    else:
        global success_time_s5
        success_time_s5 += 1

################################################

nofile = 10240
print("Setting rlimit to {:d}".format(nofile))
import resource
_, hardlimit = resource.getrlimit(resource.RLIMIT_NOFILE)
resource.setrlimit(resource.RLIMIT_NOFILE, (nofile, hardlimit))

# Create subprocess1
print("=====Step 1. create drawing=====")
threads1 = []
for i in range(howmany):
  threads1.append(threading.Thread(target = step1_create, args = (i,)))
  threads1[i].start()

# Wait for subprocess1
for i in range(howmany):
  threads1[i].join(timeout=None)

print('[Step1] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s1)/howmany, max(time_s1), min(time_s1), success_time_s1, howmany))
time.sleep(sleep_between_steps_s)

print("=====Step 2. start drawing=====")
# Create subprocess2
threads2 = []
for i in range(len(result_s1)):
  threads2.append(threading.Thread(target = step2_start, args = (i, result_s1[i])))
  threads2[i].start()

# Wait for subprocess2
for i in range(len(result_s1)):
  threads2[i].join(timeout=None)

print('[Step2] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s2)/howmany, max(time_s2), min(time_s2), success_time_s2, howmany))
time.sleep(sleep_between_steps_s)

print("=====Step 3. enrole users=====")
# Create subprocess3
threads3 = []
for i in range(len(result_s1)):
  threads3.append(threading.Thread(target = step3_users, args = (i, result_s1[i])))
  threads3[i].start()

# Wait for subprocess3
for i in range(len(result_s1)):
  threads3[i].join(timeout=None)

print('[Step3] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s3)/howmany, max(time_s3), min(time_s3), success_time_s3, howmany))
time.sleep(sleep_between_steps_s)

print("=====Step 4. end drawing=====")
# Create subprocess4
threads4 = []
for i in range(len(result_s2)):
  threads4.append(threading.Thread(target = step4_end, args = (i, result_s2[i])))
  threads4[i].start()

# Wait for subprocess1234
for i in range(len(result_s2)):
  threads4[i].join(timeout=None)

print('[Step4] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s4)/howmany, max(time_s4), min(time_s4), success_time_s4, howmany))
time.sleep(sleep_between_steps_s)

print("=====Step 5. reveal drawing=====")
# Create subprocess5
threads5 = []
for i in range(len(result1234)):
  threads5.append(threading.Thread(target = step5_reveal, args = (i,result1234[i])))
  threads5[i].start()

# Wait for subprocess5
for i in range(len(result1234)):
  threads5[i].join(timeout=None)

iDrawing_session.close()

print('[Step1] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s1)/howmany, max(time_s1), min(time_s1), success_time_s1, howmany))
print('[Step2] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s2)/howmany, max(time_s2), min(time_s2), success_time_s2, howmany))
print('[Step3] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s3)/howmany, max(time_s3), min(time_s3), success_time_s3, howmany))
print('[Step4] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s4)/howmany, max(time_s4), min(time_s4), success_time_s4, howmany))
print('[Step5] Avg time: {:.3f}, Max time: {:.3f}, Min time: {:.3f}, Successful rate: {}/{}'.format(sum(time_s5)/howmany, max(time_s5), min(time_s5), success_time_s4, howmany))
