//express
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const dotenv = require("dotenv");
dotenv.config({ path: "./env/.env" });

//carpeta public como resources
app.use("/resources", express.static("public"));
app.use("/resources", express.static(__dirname + "/public"));

app.set("view engine", "ejs");

const bcryptjs = require("bcryptjs");

const session = require("express-session");
app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));

const connection = require("./database/db");

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const user = req.body.email;
  const name = req.body.nombre;
  const pass = req.body.contraseña;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  connection.query(
    "INSERT INTO usuarios SET ?",
    {
      email: user,
      nombre: name,
      contraseña: passwordHaash,
    },
    async (error, results) => {
      if (error) {
        console.log(error);
      } else {
        res.render("register", {
          alert: true,
          alertTitle: "Registro",
          alertMessage: "registro exitoso en la base de datos.",
          alertIcon: "success",
          showConfirmButton: false,
          timer: 1500,
          ruta: "",
        });
      }
    }
  );
});
app.post("/auth", async (req, res) => {
  const user = req.body.email;
  const pass = req.body.contraseña;
  let passwordHaash = await bcryptjs.hash(pass, 8);
  if (user && pass) {
    connection.query(
      "select * from  usuarios where email= ?",
      [user],
      async (error, results) => {
        if (
          results.length == 0 ||
          !(await bcryptjs.compare(pass, results[0].contraseña))
        ) {
          res.render("login", {
            alert: "true",
            alertTitle: "Error al iniciar sesión",
            alertMessage: "Login erroneo",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: 1500,
            ruta: "/login",
          });
        } else {
          req.session.loggedin = true;
          req.session.name = results[0].nombre;
          res.render("login", {
            alert: "true",
            alertTitle: "Bienvenido",
            alertMessage: "Inició sesión correctamente",
            alertIcon: "success",
            showConfirmButton: false,
            timer: 1500,
            ruta: "/",
          });
        }
      }
    );
  }
});

app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.render("index", {
      login: true,
      name: req.session.name,
    });
  } else {
    res.render("index", {
      login: false,
      name: "Aun no inicia sesión",
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(4000, (req, res) => {
  console.log("servidor 4000 funcionando");
});
