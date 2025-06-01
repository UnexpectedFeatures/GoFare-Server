# GoFare Infrastructure Server

Backend Server for the GoFare Application

"The GoFare Application simplifies fare reloading with secure transactions, real-time balance updates, and automated receipts.
By enhancing convenience for commuters and optimizing efficiency for transport operators, it modernizes fare payment and
management in the transportation system."

## ABOUT

This server is the core infrastructure behind the GoFare Application — a modern fare management system built to serve
transportation networks with speed, reliability, and security.

It provides APIs for fare reloading, real-time balance updates, NFC/RFID card authentication, and receipt generation,
all while ensuring smooth integration with client-side mobile and kiosk applications.

## REQUIREMENTS

To run this project locally, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- A modern browser (for testing)
- Web server (e.g., Express.js for backend)
- RFID/NFC Reader compatible with your kiosk setup
- Any Database Access (This is built with Firebase)

## INSTALLATION

1. Clone the Repository:
   git clone https://github.com/JohnIvn/GoFare-Server.git
   cd gofare-server

2. Install Dependencies:
   npm install
   OR
   yarn install

3. Configure Environment:
   Create a .env file in the root directory and add your configuration:

4. Run the hardware:
   Connect the server as the same wifi as the Esp32/Arduino R4 and connect the MFRCC 522 (Or any other scanning module) module to the circuit.

   The arduino script is inside Hardware/rfid_scanner.

5. Run the Development Server:

   4a. Backend
   npm run backend
   OR
   yarn backend

6. Access the Application (Locally):
   Open your browser and go to:
   http://localhost:3000

## FEATURES

- Secure fare reloading through web, kiosk, or mobile interfaces
- Real-time NFC/RFID card balance tracking and updates
- Transactional logging with automatic digital receipts
- Role-based user access (commuter, operator, admin)
- API endpoints for commuter registration, card binding, and payment history
- Seamless integration with external systems (e.g., payment gateways or transport terminals)

## LICENSE

See the LICENSE file for more information.

---

GoFare Server — powering smarter fare systems for a seamless commute.
