const mysql = require('mysql');
const bcrypt = require('bcrypt');

let database_connection = null; 

function checkChatroomExists(chatroomName){ // return true if it exists, false if not
    let sql = 'SELECT EXISTS(SELECT * FROM chatrooms WHERE chatroom_name = ' + mysql.escape(chatroomName) + ');';
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            resolve(res[0][Object.keys(res[0])[0]]); 
        });
    });
}

function checkPasswordRequirement(chatroom_name){ // return true if chatroom has password. false otherwise
    let sql = 'select is_password_needed from chatrooms where chatroom_name = ' + mysql.escape(chatroom_name);
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res[0]) resolve(res[0][Object.keys(res[0])[0]]);
            else resolve(0);
        });
    });
}

async function createNewChatroom(chatroom_name, is_password_needed = false, password, is_saved = false){
    let doesItExist = await checkChatroomExists(chatroom_name)
    if (!doesItExist){
        const hashedPassword = await hashPassword(password);
        let sql = "INSERT INTO chatrooms (chatroom_name, is_password_needed, password, is_saved) VALUES(" + mysql.escape(chatroom_name) + "," + mysql.escape(is_password_needed) + "," + mysql.escape(hashedPassword) + "," + mysql.escape(is_saved) + ");";
        database_connection.query(sql, function(e, res, fields){
            if (e) throw e;
        });
    }
}

async function getPassword(chatroom_name){
    let sql = 'select password from chatrooms where chatroom_name = ' + mysql.escape(chatroom_name) +  ';';
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res[0]) resolve(res[0][Object.keys(res[0])[0]]);
            else resolve(0);
        });
    });
}

async function getChatroomId(chatroom_name){
    let sql = 'select chatroom_id from chatrooms where chatroom_name = ' + mysql.escape(chatroom_name) +  ';';
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res[0]) resolve(res[0][Object.keys(res[0])[0]]);
            else resolve(0);
        });
    });
}

async function isSaved(chatroom_name){
    let sql = 'select is_saved from chatrooms where chatroom_name = ' + mysql.escape(chatroom_name) +  ';';
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res[0]) resolve(res[0][Object.keys(res[0])[0]]);
            else resolve(0);
        });
    });
}

async function checkPassword(chatroom_name, password){
    const passToCompare = await getPassword(chatroom_name);

    try{
        return await bcrypt.compare(password, passToCompare);
    } catch(e){
        console.log(error);
    }

    return false;
}

async function databaseInitialise(){
    database_connection = mysql.createConnection({
        host: 'localhost',
        user: 'wassup',
        password: 'hello123',
        database: 'chatroom'
    });

    database_connection.connect(function(e){
        if (e) throw e;
    });

    let sql = "CREATE TABLE IF NOT EXISTS messages(message_id int not null auto_increment primary key, chatroom_name varchar(255), sent_by varchar(255), message text, is_private bool, sent_to varchar(255));";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });

    sql = "CREATE TABLE IF NOT EXISTS chatrooms(chatroom_id int not null auto_increment primary key, chatroom_name varchar(255), is_password_needed bool, password varchar(255),is_saved bool);";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });
};
  
function insertMessage(chatroom_id, username, message, is_private){
    let sql = "INSERT INTO messages (chatroom_id, sent_by, message, is_private) VALUES("+ chatroom_id + "," + mysql.escape(username) + "," + mysql.escape(message) + "," + mysql.escape(is_private) + ");";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });
}


function getMessages(chatroom_id){
    let sql = "SELECT * FROM messages WHERE chatroom_id = " + mysql.escape(chatroom_id) + " and is_private = false order by message_id desc limit 50";
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            //console.log(res]);
            if (e) reject(e);
            if (res[0]) resolve(res);
            else resolve(0);
        });
    });
}

async function hashPassword(password){
    try{
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error){
        console.log(error);
    }

    return null;
}

module.exports = {
    getMessages,
    insertMessage,
    databaseInitialise,
    createNewChatroom,
    checkPasswordRequirement,
    checkPassword,
    getChatroomId,
    isSaved
};