# Fetch Backend Internship Challenge
This is my submission for the assignment. I used a linked list as the core data structure for storing the transactions.

# Prerequisites
This project is built using NodeJS and ExpressJS. Click [here](https://nodejs.org/en/download) if you need to install Node. 
<br>

Please install the latest LTS version and enter ```node -v``` in your terminal to check if it is installed.

# Start
Clone this project and ```cd``` into it. 
<br>

Install the node modules:
```
npm install
```
<br>

Start the server:
```
npm run start
```
<br>

Add a transaction:
```
POST http://localhost:8000/add
```
Request body should be a JSON string with ```payer, points, timestamp``` fields. 
<br>

Spend points:
```
POST http://localhost:8000/spend
```
Request body should be a JSON string with ```points``` field. 
<br>

Fetching current point balance:
```
GET http://localhost:8000/balance
```


