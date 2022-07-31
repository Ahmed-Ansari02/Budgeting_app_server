const express = require("express");
const mysql = require("mysql");

const app = express();
const PORT = process.env.PORT || 5000;

/*const con = mysql.createConnection({
  host: "mysqlserver082002.mysql.database.azure.com",
  user: "ahmed",
  port: 3306,
  password: "Azure1234",
  database: "budgets",
});
let dbconnectionstatus = false;

let res_obj = {};
con.query("SHOW TABLES;", function (err, res) {
  console.log(res);
  if (res.length == 0) {
    console.log("connection failed :(");

    return;
  }
  dbconnectionstatus = true;
  console.log("db connection is live");
}); */
const con={}

app.use(express.json());

app.post("/savedata/", (req, res) => {
  const data_received = req.body;
  if (dbconnectionstatus) {
    let User_id = data_received.user_id;
    let User_name = data_received.user_name;
    data_received.list_item.map((item, index) => {
      console.log(index + 1, item);

      con.query(
        `insert into budgets (item, price, quantity, category, date_purchased,user_id,user_name) values("${
          item[0]
        }",${parseInt(item[1])},${parseInt(item[2])},"${item[3]}","${
          item[4]
        }", "${User_id}", "${User_name}");`,
        (err, dbres) => {
          if (err) {
            res.status(400);
            res.send("failed to save");
            console.log(err);
            return;
          }
          console.log(dbres)
        }
      );
    });
    res.send("ok");
    ;
  }
});

app.get("/fetch_data/:user_id", (req, res) => {
  con.query(
    `select id,item, price, quantity, category, date_purchased from budgets where user_id="${req.params.user_id}"`,
    (err, db_res) => {
      if (err) throw err;

      res.send(db_res);
    }
  );
});

app.get("/summarydata/:cur_month/:last_month/:user_id", async (req, res) => {
  await new Promise((resolve, reject) => {
    con.query(
      `select sum( price*quantity) as Total_price from budgets where MONTH(date_purchased) ="${req.params.cur_month}" and user_id=${req.params.user_id};`,
      (err, db_res) => {
        if (err) throw err;

        res_obj.curr_month_total = db_res;
        console.log(db_res);
        resolve();
      }
    );
  });
  await new Promise((resolve, reject) => {
    con.query(
      `select sum( price*quantity) as Total_price from budgets where MONTH(date_purchased) ="${req.params.last_month}" and user_id="${req.params.user_id}";`,
      (err, db_res) => {
        if (err) throw err;

        res_obj.last_month_total = db_res;
        console.log(db_res);
        resolve();
      }
    );
  });
  await new Promise((resolve, reject) => {
    con.query(
      `SELECT item, quantity from budgets  WHERE MONTH(date_purchased)="${req.params.cur_month}" and user_id=${req.params.user_id} order by quantity DESC LIMIT 1;`,
      (err, db_res) => {
        if (err) throw err;

        res_obj.most_bought = db_res;
        console.log(db_res);
        resolve();
      }
    );
  });
  await new Promise((resolve, reject) => {
    con.query(
      `SELECT item, price*quantity as Total_price from budgets WHERE MONTH(date_purchased)="${req.params.cur_month}" and user_id=${req.params.user_id} order by quantity DESC LIMIT 1;`,
      (err, db_res) => {
        if (err) throw err;

        res_obj.greatest_exp = db_res;
        console.log(db_res);
        resolve();
      }
    );
  });

  console.log(res_obj);
  res.send(res_obj);
});

app.get("/linegraphdata/:user_id", (req, res) => {
  con.query(
    `select MONTH(date_purchased) as month ,sum(price *quantity) as total  from budgets where user_id=${req.params.user_id} GROUP BY MONTH(date_purchased);`,
    (err, db_res) => {
      if (err) throw err;

      console.log(db_res);
      res.send(db_res);
    }
  );
});

app.get("/categorydata/:cur_month/:user_id", (req, res) => {
  console.log(req.params.cur_month);
  let x = 7;
  con.query(
    `select category, sum(price*quantity) as total from budgets where MONTH(date_purchased)="${req.params.cur_month}" and user_id=${req.params.user_id} group by category;`,
    (err, db_res) => {
      if (err) throw err;

      console.log(db_res);
      res.send(db_res);
    }
  );
});

app.delete("/deleteitem/:id/:user_id", (req, res) => {
  con.query(
    `delete from budgets where id=${req.params.id} and user_id=${req.params.user_id}`,
    (err, db_res) => {
      if (err) {
        res.status(400);
        throw err;
      }

      
      res.send("ok");
    }
  );
});

app.delete("/deleteitem_multiples/:user_id",(req,res)=>{
  let id_query=req.body.join()
  
  con.query(
    `delete from budgets where id IN (${id_query}) and user_id=${req.params.user_id}`,
    (err, db_res) => {
      if (err) {
        res.status(400);
        throw err;
      }

      console.log(db_res);
      res.send("ok");
    }
  )
})

app.get("/reset", (req, res) => {
  console.log("/reset");
  con.query(`Truncate table budgets;`, (err, db_res) => {
    console.log(db_res);
    res.send("reset!");
  });
});
app.get("/",(req,res)=>{
  res.send("<h1>Hello</h1>")
})

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
