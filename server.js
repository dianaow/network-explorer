const express = require("express")
const app = express()
const PORT = process.env.PORT || 3000
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT

const Pool = require('pg').Pool

app.use(express.json())

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  )
  next()
})

app.post("/data", function (req, res, next) {

  const { user, host, database, password, port, entity, date_range, nodes_db_table, edges_db_table, entities_col, date_range_col } = req.body
  //console.log(entities_col, date_range_col, entity, date_range)
  const pool = new Pool({
    user,
    host,
    database,
    password,
    port: 5432
  });

  getData(pool, nodes_db_table, edges_db_table, entities_col, date_range_col, entity, date_range)
    .then(response => {
      res.send({nodes: response[0], edges: response[1]})
    })
    .catch(error => {
      console.log(error)
    })

})

const getData = async (pool, nodes_db_table, edges_db_table, entities_col, date_range_col, entities, date_range) => {
  //const sql = `SELECT * FROM sessions WHERE ${entites_col} IN (` + entites.join(',') +  ")" + `AND (${date_range_col} >= $2 AND ${date_range_col} <= $3)`

  const p1 = new Promise(function(resolve, reject) {
     let node_sql = `SELECT * FROM ${nodes_db_table}`
     pool.query(node_sql, [], (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
    })
  }) 

  const p2 = new Promise(function(resolve, reject) {
    let sql, values
    if(date_range & entities){
      sql = `SELECT * FROM ${edges_db_table} WHERE ${entities_col} = $1 AND (${date_range_col} >= $2 AND ${date_range_col} <= $3)`
      values = [entities, date_range[0], date_range[1]]
    } else if(entities) {
      sql = `SELECT * FROM ${edges_db_table} WHERE ${entities_col} = $1`
      values = [entities]
    } else {
      sql = `SELECT * FROM ${edges_db_table}`
    }
     pool.query(sql, values, (error, results) => {
      if (error) {
        reject(error)
      }
      resolve(results.rows);
    })
  }) 

  const data = await Promise.all([p1, p2])
  return data
}

app.use(express.static(__dirname + "/build"))

app.listen(PORT, "0.0.0.0", function onStart(err) {
  if (err) {
    console.log(err)
  }
  console.info(
    "==> 🌎 Listening on port %s. Open up http://0.0.0.0:%s/ in your browser.",
    PORT,
    PORT
  )
})