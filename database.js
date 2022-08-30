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
    // console.log(password);
    if (!doesItExist){
        let hashedPassword = null;
        if (password){
            hashedPassword = await hashPassword(password);
        }
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
        console.log(e, passToCompare);
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

    let sql = "CREATE TABLE IF NOT EXISTS messages(message_id int not null auto_increment primary key, chatroom_name varchar(255), sent_by varchar(255), message text, is_private bool, sent_to varchar(255), is_image bool);";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });

    sql = "CREATE TABLE IF NOT EXISTS chatrooms(chatroom_id int not null auto_increment primary key, chatroom_name varchar(255), is_password_needed bool, password varchar(255),is_saved bool);";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });

    sql = "CREATE TABLE IF NOT EXISTS images(image_id int not null auto_increment primary key, file_name varchar(255) not null, directory varchar(255) not null, file_type varchar(255) not null, message_id int);";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });
};
  
function insertMessage(chatroom_id, username, message, is_private, is_image=false){
    let sql = "INSERT INTO messages (chatroom_id, sent_by, message, is_private, sent_to, is_image) VALUES("+ chatroom_id + "," + mysql.escape(username) + "," + mysql.escape(message) + "," + mysql.escape(is_private) + "," + mysql.escape(null) + "," + mysql.escape(is_image) + ");";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });
}

async function insertMessageGetId(chatroom_id, username, message, is_private, is_image=false){
    let sql = "INSERT INTO messages (chatroom_id, sent_by, message, is_private, sent_to, is_image) VALUES("+ chatroom_id + "," + mysql.escape(username) + "," + mysql.escape(message) + "," + mysql.escape(is_private) + "," + mysql.escape(null) + "," + mysql.escape(is_image) + ");";
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res[0]){//console.log(res);
                resolve(1);
            } 
            else resolve(0);
        });
    });
}

async function getLastInsertedID(){
    let sql = "select last_insert_id();";
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res[0]) resolve(res[0][Object.keys(res[0])[0]]);
            else resolve(0);
        });
    });
}

async function insertImage(file_name, directory, file_type, chatroom_id, username, message, is_private, is_image=false){
    await insertMessageGetId(chatroom_id, username, message, is_private, is_image);
    let message_id = await getLastInsertedID();
    let sql = "INSERT INTO images(file_name, directory, file_type, message_id) VALUES(" + mysql.escape(file_name) + "," + mysql.escape(directory) + "," + mysql.escape(file_type) + "," + mysql.escape(message_id) + ");";
    database_connection.query(sql, function(e, res, fields){
        if (e) throw e;
    });
}

function getMessages(chatroom_id){
    // let sql = "SELECT * FROM messages where chatroom_id = " + mysql.escape(chatroom_id) +';';
    let sql = "SELECT * FROM messages LEFT JOIN images on messages.message_id = images.message_id WHERE chatroom_id = " + mysql.escape(chatroom_id) + " and is_private = false order by messages.message_id desc limit 50";
    return new Promise((resolve, reject) => {
        database_connection.query(sql, function(e, res, fields){
            if (e) reject(e);
            if (res) resolve(res);
            else resolve(0);
        });
    });
}

async function hashPassword(password){
    try{
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (e){
        console.log(e);
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
    isSaved,
    insertImage
};