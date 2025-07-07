# GoFare Infrastructure Server

> Backend Server for the GoFare Application

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Arduino](https://img.shields.io/badge/Arduino-00979D?logo=arduino&logoColor=white)
![ESP32](https://img.shields.io/badge/ESP32-Microcontroller-blue)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)
![MSSQL](https://img.shields.io/badge/MSSQL-CC2927?logo=microsoftsqlserver&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Android Studio](https://img.shields.io/badge/Android%20Studio-3DDC84?logo=androidstudio&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)

---

## About

This server is the core infrastructure behind the GoFare Application — a modern fare management system built to serve
transportation networks with speed, reliability, and security.

It provides APIs for fare reloading, real-time balance updates, NFC/RFID card authentication, and receipt generation,
all while ensuring smooth integration with client-side mobile and kiosk applications.

---

## Table of Contents

- [Requirements](#requirements)
- [Features](#features)
- [Release](#release)
- [Installation](#installation)
- [Structure](#structure)
- [Technologies Used](#technologies-used)
- [License](#license)

---

## Requirements

To run this project locally, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- A modern browser (for testing)
- Web server (e.g., Express.js for backend)
- RFID/NFC Reader compatible with your kiosk setup
- Any Database Access (This is built with Firebase)

---

## Features

- Secure fare reloading through web, kiosk, or mobile interfaces
- Real-time NFC/RFID card balance tracking and updates
- Transactional logging with automatic digital receipts
- Role-based user access (commuter, operator, admin)
- API endpoints for commuter registration, card binding, and payment history
- Seamless integration with external systems (e.g., payment gateways or transport terminals)

---

## Release

- Alternatively you can download the `.zip` file from the [Releases](https://github.com/UnexpectedFeatures/GoFare-Server/releases/) section.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/JohnIvn/GoFare-Server.git
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment
Create a .env file in the root directory and add your configuration:
```bash
WS_PORT=
WS_PORT_2=
WS_PORT_3=

MAIL_USER=
MAIL_PASS=
```
Export your firebase service account and rename it:

```bash
key.json
```
### 4. Wiring Diagram

| MFRC522 Pin | ESP32 Pin          |
| ----------- | ------------------ |
| SDA         | 5                  |
| SCK         | 18                 |
| MOSI        | 23                 |
| MISO        | 19                 |
| IRQ         | Not connected      |
| GND         | GND                |
| RST         | 4                  |
| 3.3V        | 3.3V (**not 5V!**) |

### 5. Run the hardware

The arduino script is inside Hardware/rfid_scanner.

### 6. Run the server

```bash
   cd backend
```

npm
```bash
   npm run backend
```
yarn
```bash
   yarn backend
```
---

## Structure

```bash
/
├── Backend/
│   ├── Controllers/
│   │   ├── Admins/
│   │   ├── Discounts/
│   │   ├── Drivers/
│   │   ├── Events/
│   │   ├── RFID-NFC/
│   │   ├── Refund/
│   │   ├── Requests/
│   │   ├── Stripe/
│   │   ├── Users/
│   │   ├── VehicleA/
│   │   └── VehicleB/
│   ├── Routes/
│   ├── Services/
│   ├── Tesseract/
│   └── Websockets/                     
└── Hardware/
    └── rfid_scanner/              
```

---

## Technologies-Used

| Category | Tools                                   |
| -------- | --------------------------------------- |
| Frontend | Android Studio, Visual Basic & React JS |
| Backend  | Node JS & Websockets                    |
| Database | Firebase, MYSQL & MSSQL                 |
| Hardware | Esp 32, Arduino UNO R3 & RC522          |

---

## Testing

Once everything is set up and the server is running, you can test simply by going to the url.

---

## License

See the [LICENSE](LICENSE) file for more information.

---

> Built with ❤️ by JohnIvn
