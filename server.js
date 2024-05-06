const Alpaca = require('@alpacahq/alpaca-trade-api');
const { company } = require('@alpacahq/alpaca-trade-api/lib/resources/polygon');

const alpaca = new Alpaca(); 


const WebSocket = require('ws');

/*
So what is a websocket?
A websocket is a communication protocol that allows for real-time data transfer between a client and a server.
It is a two-way communication protocol that allows the server to send data to the client without the client having to request it.
This is in contrast to the traditional HTTP protocol, which is a one-way communication protocol where the client has to request data from the server.
Websockets are commonly used in applications that require real-time data transfer, such as chat applications, online gaming, and financial trading platforms.

In this project, we will be using websockets to receive real-time stock price data from the Alpaca API.
We will be using the Alpaca API to subscribe to real-time stock price data for a given stock symbol, and then we will use websockets to receive the real-time data from the Alpaca API.
We will then log the real-time stock price data to the console.
*/

const wss = new WebSocket("wss://stream.data.alpaca.markets/v1beta1/news");


wss.on('open', function open() {
    console.log("Connected to Alpaca API");

    const authMsg = {
        action: "auth",
        key : process.env.APCA_API_KEY_ID,
        //Secret key is not to be shared
        
    };

    wss.send(JSON.stringify(authMsg)); // Send authorization message to Alpaca API and then log us in

    // Subscribe to all news feed

    const subscribeMsg = {
        action: "subscribe",
        news: ['*'] // If for a particular stock, replace * with the stock symbol for example ['AAPL']
    };

    wss.send(JSON.stringify(subscribeMsg)); // Subscribe to news feed
    
});


wss.on('message',async function(message){
    console.log("Message is received from Alpaca API : " + message);
    // The message is always a string in JSON format
    // "T" : "n" that means it is a news message

    const currentEvent = JSON.parse(message)[0];
    if(currentEvent.T === "n"){

        let companyImpact = 0;

        console.log("News : " + currentEvent.headline);

        // GPT-3 API
        const apiRequestBody = {
            "model" : "gpt-3.5-turbo",
            "messages" : [
                { role : "system", content : "Only respond with a number from 1-100 detailing the impact of the news on the corresponding stock. 100 being most positive impact and 1 being most negative impact of the headline." },
                { role : "user", content : "Given the headline '" + currentEvent.headline + "', what is the impact of the headline on the stock? Reply only in number ranging from 1-100 depicting the impact of the news on the corresponding stock." }
            ]
        };


        await fetch("https://api.openai.com/v1/chat/completions", {
            method : "POST",
            headers : {
                "Authorization" : "Bearer " + ; // GPT-3 API Key
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(apiRequestBody)
        }).then((data) => {
            return data.json();
        }).then((data)=>{
            // data has the repsonse
            console.log(data);
            console.log("Response from GPT-3 API : " + data.choices[0].message.content);
            companyImpact = parseInt(data.choices[0].message.content);
        })


        // Make trades based on it
        const tickerSymbol = currentEvent.symbols[0];
        if(companyImpact>=90){
            // Buy the stock
            let order = await alpaca.createOrder({
                symbol: tickerSymbol,
                qty: 1,
                side: 'buy',
                type: 'market',
                time_in_force: 'day' // This order will be active only for the day
            });

        }else if(companyImpact<=15)
        {
            // Sell!
            let closedPosition = alpaca.closedPosition(tickerSymbol);
        }


    }
});