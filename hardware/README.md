# BlindSpot — Hardware Architecture & Integration Guide

This document specifies the hardware integration architecture for connecting the **BlindSpot Intelligent Spatial Awareness System** to wearable haptic feedback devices and embedded edge processors.

---

## 1. System Block Diagram

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     PRIMARY VEHICLE / USER                   │
   │                                                             │
   │  ┌────────────────┐         ┌────────────────────────────┐  │
   │  │ Monocular Cam  │         │ Edge AI Host               │  │
   │  │ (RGB / 1080p)  │ ──────> │ (Laptop / Jetson / RPi 5)  │  │
   │  └────────────────┘  USB    │ FastAPI + YOLOv8 + Fusion  │  │
   │                             └─────────────┬──────────────┘  │
   │                                           │                 │
   │                                           │ BLE / UART / WS │
   │                                           ▼                 │
   │                             ┌────────────────────────────┐  │
   │                             │ ESP32 Haptic Controller    │  │
   │                             │ (Wearable Belt / Handlebar)│  │
   │                             └─────────────┬──────────────┘  │
   │                                           │ PWM             │
   │                      ┌────────────────────┼────────────────────┐
   │                      ▼                    ▼                    ▼
   │               ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │               │ LEFT MOTOR  │      │ CENTER MOTOR│      │ RIGHT MOTOR │
   │               │ (Vibration) │      │ (Vibration) │      │ (Vibration) │
   │               └─────────────┘      └─────────────┘      └─────────────┘
   └─────────────────────────────────────────────────────────────┘
```

---

## 2. Microcontroller & Vibration Driver Circuit

### Recommended Components
* **Microcontroller**: ESP32-WROOM-32 / ESP32-S3 (with Bluetooth LE + WiFi)
* **Vibration Actuators**: 3x Coin Type ERM Vibration Motors (10mm, 3V, 80mA) or LRA Haptic Actuators (with DRV2605L driver)
* **Driver Transistors**: 3x 2N2222 NPN BJT or 2N7002 MOSFETs
* **Flyback Protection**: 3x 1N4148 Diodes
* **Current Limiting Resistors**: 3x 1kΩ (Base), 3x 100Ω (Motor series)
* **Power Supply**: 3.7V LiPo Battery (500mAh) + TP4056 USB-C Charger + 3.3V LDO Regulator

### ESP32 GPIO Pin Assignments
| Motor Channel | ESP32 GPIO | PWM Timer Channel | Function |
| :--- | :--- | :--- | :--- |
| **LEFT MOTOR** | `GPIO 18` | Channel 0 | Left blind-spot & approaching threat cue |
| **CENTER MOTOR** | `GPIO 19` | Channel 1 | Path corridor obstruction & head-on obstacle |
| **RIGHT MOTOR** | `GPIO 23` | Channel 2 | Right blind-spot & cross-traffic threat cue |
| **STATUS LED** | `GPIO 2` | - | BLE connection status |

---

## 3. Vibration Haptic Patterns

| Pattern Key | Target Motors | Sequence Timing (ms) | Operational Meaning |
| :--- | :--- | :--- | :--- |
| `LEFT_PULSE` | Left Motor | 150ms ON, 50ms OFF, 150ms ON | Object approaching/encroaching from Left |
| `RIGHT_PULSE` | Right Motor | 150ms ON, 50ms OFF, 150ms ON | Object approaching/encroaching from Right |
| `CENTER_PULSE` | Center Motor | 250ms Continuous Pulse | Obstacle centered directly ahead in path |
| `DOUBLE_PULSE` | Left + Right | 100ms ON, 50ms OFF, 100ms ON | Narrow passage detected / Flanking obstacles |
| `RAPID_ALERT` | All 3 Motors | 80ms ON, 40ms OFF (3 cycles) | **CRITICAL IMMINENT COLLISION** |

---

## 4. ESP32 Arduino C++ Firmware (BLE + Serial Ready)

```cpp
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define PIN_MOTOR_LEFT   18
#define PIN_MOTOR_CENTER 19
#define PIN_MOTOR_RIGHT  23
#define PIN_LED_STATUS   2

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

void triggerMotorPulse(int pin, int durationMs, int count, int pauseMs = 50) {
  for (int i = 0; i < count; i++) {
    digitalWrite(pin, HIGH);
    delay(durationMs);
    digitalWrite(pin, LOW);
    if (i < count - 1) delay(pauseMs);
  }
}

void executePattern(String pattern) {
  pattern.trim();
  Serial.print("Executing Haptic Pattern: ");
  Serial.println(pattern);

  if (pattern == "LEFT_PULSE") {
    triggerMotorPulse(PIN_MOTOR_LEFT, 150, 2, 50);
  } else if (pattern == "RIGHT_PULSE") {
    triggerMotorPulse(PIN_MOTOR_RIGHT, 150, 2, 50);
  } else if (pattern == "CENTER_PULSE") {
    triggerMotorPulse(PIN_MOTOR_CENTER, 250, 1);
  } else if (pattern == "DOUBLE_PULSE") {
    digitalWrite(PIN_MOTOR_LEFT, HIGH);
    digitalWrite(PIN_MOTOR_RIGHT, HIGH);
    delay(150);
    digitalWrite(PIN_MOTOR_LEFT, LOW);
    digitalWrite(PIN_MOTOR_RIGHT, LOW);
  } else if (pattern == "RAPID_ALERT") {
    for (int k = 0; k < 3; k++) {
      digitalWrite(PIN_MOTOR_LEFT, HIGH);
      digitalWrite(PIN_MOTOR_CENTER, HIGH);
      digitalWrite(PIN_MOTOR_RIGHT, HIGH);
      delay(80);
      digitalWrite(PIN_MOTOR_LEFT, LOW);
      digitalWrite(PIN_MOTOR_CENTER, LOW);
      digitalWrite(PIN_MOTOR_RIGHT, LOW);
      delay(40);
    }
  }
}

class MyCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      executePattern(value);
    }
  }
};

void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTOR_LEFT, OUTPUT);
  pinMode(PIN_MOTOR_CENTER, OUTPUT);
  pinMode(PIN_MOTOR_RIGHT, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);

  // Self-test vibration on boot
  digitalWrite(PIN_MOTOR_LEFT, HIGH);
  delay(100);
  digitalWrite(PIN_MOTOR_LEFT, LOW);
  digitalWrite(PIN_MOTOR_CENTER, HIGH);
  delay(100);
  digitalWrite(PIN_MOTOR_CENTER, LOW);
  digitalWrite(PIN_MOTOR_RIGHT, HIGH);
  delay(100);
  digitalWrite(PIN_MOTOR_RIGHT, LOW);

  // Initialize BLE
  BLEDevice::init("BlindSpot-Haptic-Belt");
  pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  Serial.println("BlindSpot Haptic BLE Controller Ready.");
}

void loop() {
  // Check USB-UART serial backup commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    executePattern(cmd);
  }
  delay(10);
}
```
