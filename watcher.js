const https = require("https");
var aws = require('aws-sdk');
var ses = new aws.SES({region: 'eu-central-1'});

const mailtoaddr = "???@???";
const mailfromaddr = "???@???";
const domainstocheck = ["<subdomain>.<yourdomain>.<tld>"];
 
exports.handler = async (event, context, callback) => {
     
    let htmlMail = "";

   
    for(let domain of domainstocheck){
        let resp = await checkcert(domain);
        console.log("Result for " + domain + ": " + resp);
        htmlMail = htmlMail + "<div>" + "Result for " + domain + ": " + resp + "</div><br>";
    }
    
    var params = {
        Destination: {
            ToAddresses: [mailtoaddr]
        }, 
        Message: {
            Body: {
                Html: {
                    Charset: "utf-8",
                    Data: htmlMail
                }
            },
            
            Subject: { 
                Data: "SSL Certificate Results"
                
            }
        },
        Source: mailfromaddr
    };

    await sendMailViaSes(params);
    
    callback(null, {
        statusCode: 200,
        body: JSON.stringify('All checked and mail sent!'),
    });
    
     
};


async function sendMailViaSes(params){
     await ses.sendEmail(params).promise();
}



async function checkcert(hosttocheck) {
    var options = {
        hostname: hosttocheck,
        port: 443,
        path: "/",
        method: 'GET',
        rejectUnauthorized: false
    };

 
    return new Promise((resolve) => {
 
            var req = https.request(options, (res) => {
                
                 res.fingerprint = res.socket.getPeerCertificate().fingerprint;
                    
                const crt = res.socket.getPeerCertificate();
                //let vFrom = crt.valid_from;
                let vTo = crt.valid_to;
                var validTo = new Date(vTo);
                let resp = validTo.toISOString();
                resolve(resp);
        
                res.destroy();
    
            }).on('end', (e) => {
                console.log("end");
            }).on('data', (e) => {
                console.log("data");
            }).on('error', (e) => {
                console.error("error");
            });

            req.end();

    });


}

 