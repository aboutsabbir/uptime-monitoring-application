/*
* Title: check Handler
* Description: Handler to handle user defined checks
* Author: Md. Sabbir Ahmed
* Date: 17-08-2021
*/

// dependencies
const data = require('../../lib/data');
const {hash, parseJSON, createRandomString} = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');
const environement = require('../../helpers/environments');

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback)=>{
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if(acceptedMethods.indexOf(requestProperties.method) > -1){
        handler._check[requestProperties.method](requestProperties, callback);

    }else{
        callback(405);

    }    
};

//module scaffolding to keep the main function complexity free
handler._check = {};

handler._check.post = (requestProperties, callback)=>{
    // validate inputs
    let protocol = 
        typeof(requestProperties.body.protocol) == 'string'
        && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol
            : false;
    
    let url = 
        typeof(requestProperties.body.url) == 'string'
        && requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url
            : false;
    
    let method = 
        typeof(requestProperties.body.method) == 'string' 
        && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1 
            ? requestProperties.body.method 
            : false;
    
    let successCodes = 
        typeof(requestProperties.body.successCodes) == 'object' && requestProperties.body.successCodes instanceof Array
            ? requestProperties.body.successCodes
            : false;
    
    let timeoutSeconds = 
        typeof(requestProperties.body.timeoutSeconds) == 'number' &&
        requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 &&
        requestProperties.body.timeoutSeconds <= 5
            ? requestProperties.body.timeoutSeconds
            : false;

    if(protocol && url && method && successCodes && timeoutSeconds){
        let token = 
            typeof(requestProperties.headersObject.token) == 'string'
                ? requestProperties.headersObject.token
                : false;
        
        // lookup the user phone by reading the token
        data.read('tokens', token, (err, tokenData)=>{
            if(!err && tokenData){
                let userPhone = parseJSON(tokenData).phone;

                // lookup the user data
                data.read('users', userPhone, (err2, userData)=>{
                    if(!err2 && userData){
                        tokenHandler._token.verify(token, userPhone, (tokenIsValid)=>{
                            if(tokenIsValid){
                                let userObject = parseJSON(userData);
                                let userChecks = typeof(userObject.checks) == 'object' && userObject.checks instanceof Array ? userObject.checks : [];

                                if(userChecks.length < environement.maxChecks){
                                    let checkId = createRandomString(20);
                                    let checkObject = {
                                        'id': checkId,
                                        'userPhone' : userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds
                                    };

                                    // save the object
                                    data.create('checks', checkId, checkObject, (err3)=>{
                                        if(!err3){
                                            // add check id to the user's object
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            // save the new userData
                                            data.update('users', userPhone, userObject, (err4)=>{
                                                if(!err){
                                                    callback(200, checkObject);
                                                }else{
                                                    callback(500, {
                                                        error: 'There was a server side error'
                                                    })
                                                }
                                            });
                                        }else{
                                            callback(500, {
                                                error: 'There was a problem in the server side!',
                                            })
                                        }
                                    })

                                }else{
                                    callback(401, {
                                        error: 'User already has reached max check limit!',
                                    })
                                }
                            }else{
                                callback(403, {
                                    error: 'Authentication Failure',
                                });
                            }
                        });
                    }else{
                        callback(403,{
                            error: 'User not found!'
                        })
                    }
                });
            }else{
                callback(403, {
                    error: 'Authentication problem',
                });
            }
        });
    }else{
        callback(400,{
            error: 'You have a problem in your request'
        })
    }


}


handler._check.get = (requestProperties, callback)=>{
    const id = 
        typeof(requestProperties.queryStringObject.id)== 'string' && 
        requestProperties.queryStringObject.id.trim().length == 20
            ? requestProperties.queryStringObject.id 
            : false;
    
    if(id){
        // lookup the check
        data.read('checks', id, (err, checkData)=>{
            if(!err && checkData){
                let token = 
                    typeof(requestProperties.headersObject.token) == 'string'
                        ? requestProperties.headersObject.token
                        : false;

                        tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid)=>{
                            if(tokenIsValid){
                                callback(200,parseJSON(checkData));

                            }else{
                                callback(403,{
                                    error: 'Authentication failure!',
                                });
                            }
                        });
            }else{
                callback(500,{
                    error: 'You hace a problem with the server!'
                });
            }
        })
    }else{
        callback(400,{
            error: 'You have a problem in your request',
        });
    }
}


handler._check.put = (requestProperties, callback)=>{
    let id = 
        typeof(requestProperties.body.id) == 'string'
        && requestProperties.body.id.trim().length == 20
            ? requestProperties.body.id
            : false;
    
    // validate inputs
    let protocol = 
        typeof(requestProperties.body.protocol) == 'string'
        && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol
            : false;
    
    let url = 
        typeof(requestProperties.body.url) == 'string'
        && requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url
            : false;
    
    let method = 
        typeof(requestProperties.body.method) == 'string' 
        && ['get', 'post', 'put', 'delete'].indexOf(requestProperties.body.method) > -1 
            ? requestProperties.body.method 
            : false;
    
    let successCodes = 
        typeof(requestProperties.body.successCodes) == 'object' && requestProperties.body.successCodes instanceof Array
            ? requestProperties.body.successCodes
            : false;
    
    let timeoutSeconds = 
        typeof(requestProperties.body.timeoutSeconds) == 'number' &&
        requestProperties.body.timeoutSeconds % 1 === 0 && requestProperties.body.timeoutSeconds >= 1 &&
        requestProperties.body.timeoutSeconds <= 5
            ? requestProperties.body.timeoutSeconds
            : false;
    
    if(id){
        if(protocol || url || method || successCodes || timeoutSeconds){
            data.read('checks', id, (err, checkData)=>{
                if(!err && checkData){
                    let checkObject = parseJSON(checkData);

                    let token = 
                    typeof(requestProperties.headersObject.token) == 'string'
                        ? requestProperties.headersObject.token
                        : false;

                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid)=>{
                            if(tokenIsValid){
                                if(protocol){
                                    checkObject.protocol = protocol;
                                }
                                if(url){
                                    checkObject.url = url;
                                }
                                if(method){
                                    checkObject.method = method;
                                }
                                if(successCodes){
                                    checkObject.successCodes = successCodes;
                                }
                                if(timeoutSeconds){
                                    checkObject.timeoutSeconds = timeoutSeconds;
                                }

                                data.update('checks', id, checkObject, (err2)=>{
                                    if(!err2){
                                        callback(200, {
                                            message: 'Check updated!'
                                        });
                                    }
                                    else{
                                        callback(500, {
                                            error: 'There is a server side problem',
                                        })
                                    }
                                });
                            }else{
                                callback(403, {
                                    error: 'Authentication Error!'
                                })
                            }
                        });

                }else{
                    callback(500, {
                        error: "There was a problem in the server side",
                    })
                }
            })
        }else{
            callback(400, {
                error: 'Provide fields to update',
            })
        }
    }else{
        callback(400, {
            error: 'You have a problem in your request!'
        });
    }
}


handler._check.delete = (requestProperties, callback)=>{
    const id = 
        typeof(requestProperties.queryStringObject.id) == 'string' && 
        requestProperties.queryStringObject.id.trim().length == 20
            ? requestProperties.queryStringObject.id 
            : false;
    
    if(id){
        // lookup the check
        data.read('checks', id, (err, checkData)=>{
            if(!err && checkData){
                let token = 
                    typeof(requestProperties.headersObject.token) == 'string'
                        ? requestProperties.headersObject.token
                        : false;

                        tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid)=>{
                            if(tokenIsValid){
                                // delete the check data
                                data.delete('checks', id, (err2)=>{
                                    if(!err2){
                                        data.read('users', parseJSON(checkData).userPhone, (err3, userData) => {
                                            let userObject = parseJSON(userData);
                                            if(!err3 && userData){
                                               let userChecks = typeof(userObject.checks) == 'object' && userObject.checks instanceof Array ? userObject.checks : [];

                                               // remove the deleted check id from users list of checks
                                               let checkPos = userChecks.indexOf(id);
                                               if(checkPos > -1){
                                                userChecks.splice(checkPos, 1);
                                                // receive the user data
                                                userObject.checks = userChecks;
                                                data.update('users', userObject.phone, userObject, (err4)=>{
                                                    if(!err4){
                                                        callback(200);
                                                    }else{
                                                        callback(500, {
                                                            error: 'Server side problem!'
                                                        });
                                                    }
                                                })
                                               }else{
                                                    callback(404, {
                                                        error: 'The check id not found for this user!'
                                                    });
                                               }

                                            }else{
                                                callback(500, {
                                                    error: 'Server side problem!'
                                                })
                                            }
                                        })
                                    }else{
                                        callback(500, {
                                            error: 'There was a server side problem'
                                        })
                                    }
                                })

                            }else{
                                callback(403,{
                                    error: 'Authentication failure!',
                                });
                            }
                        });
            }else{
                callback(500,{
                    error: 'You hace a problem with the server!'
                });
            }
        })
    }else{
        callback(400,{
            error: 'You have a problem in your request',
        });
    }
}

module.exports = handler;