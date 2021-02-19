/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { BCRYPT_WORK_FACTOR } = require("../config");


/** User of the site. */

class User {
  constructor(username, password, first_name, last_name, phone, join_at, last_login_at){
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
    this.join_at = join_at;
    this.last_login_at = last_login_at
  }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(`
      INSERT INTO users (username, password, first_name, last_name, phone, join_at)
      VALUES
      ($1, $2, $3, $4, $5, current_timestamp)
      RETURNING *
    `, [username, hashedPassword, first_name, last_name, phone])
    const newU = result.rows[0]
    return new User(newU.username, newU.password, newU.first_name, newU.last_name, newU.phone)
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    console.log(username, password)
    const result = await db.query(`
      SELECT * FROM users WHERE username = $1
    `, [username])

    const user = result.rows[0]

    if(user){
      if(await bcrypt.compare(password, user.password)){
        return true
      }
    }else{
      return false
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    await db.query(`
      UPDATE users SET last_login_at = current_timestamp
      WHERE username = $1
    `, [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(`
      SELECT username, first_name, last_name, phone FROM users  
    `)
    const users = result.rows.map(u => new User(u.username, u.first_name, u.last_name, u.phone))
    return users
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users 
      WHERE username = $1
    `, [username])
    const user = result.rows[0]
    return new User(user.username, user.first_name, user.last_name, user.phone, user.join_at, user.last_login_at)
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`
      SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE to_username = $1
    `, [username])
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`
      SELECT id, from_username, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1
    `, [username])
   }
}


module.exports = User;