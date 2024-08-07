import express from "express";
import { Server } from "socket.io";
import mongoose from "mongoose";
import path from "path"

import routerProducts from "./routes/products.js";
import routerCarts from "./routes/carts.js";
import viewsRoutes from "./routes/views.routes.js";
import handlebars from "express-handlebars"
import __dirname from "./dirname.js";
import { productModel } from "./models/product.model.js";

const app = express();
const PORT = 8080;
const dbName = "backend-I";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "../public")));

app.engine(
    "hbs",
    handlebars.engine({
        extname: "hbs",
        defaultLayout: "main",
    })
);

app.set("view engine", "hbs");
app.set("views", `${__dirname}/views`);

app.use("/api/products", routerProducts);
app.use("/api/carts", routerCarts);
app.use("/", viewsRoutes);

mongoose.connect(`mongodb://localhost:27017/${dbName}`)
    .then(() => console.log("Conexión con MongoDB establecida"))  
    .catch((error) => console.log(error));

const httpServer = app.listen(PORT, () => {
    console.log(`Servidor creado en puerto http://localhost:${PORT}`);
});

const io = new Server(httpServer);

let products = await productModel.find();

io.on("connection", async (socket) => {
    console.log("Conexión establecida");

    try {
        const products = await productModel.find();
        socket.emit('products', products);
    } catch (error) {
        console.log(error);
    }

    socket.on("disconnect", () => {
        console.log("Cliente desconectado");
    });

    socket.on('addProduct', (product) => {
        const newId = products[products.length - 1].id + 1;
        const newProduct = { id: newId, ...product };
        products.push(newProduct);
        fs.writeFileSync('./src/data/products.json', JSON.stringify(products, null, '\t'));
        io.emit('productos', products);
    });

    socket.on('deleteProduct', (productId) => {
        products = products.filter(p => p.id !== productId);
        fs.writeFileSync('./src/data/products.json', JSON.stringify(products, null, '\t'));
        io.emit('products', products);
    });

    socket.emit('products', products);
});