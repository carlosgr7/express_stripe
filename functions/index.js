const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51QtaNxRsjT749tBHMkVwN7L7F88Ing7EksbyrlW4nBm8otmb7OES1pcPOyw6jVM3OIXyjkO09JOn1kpq7eINRwHU00iGHz1wYR");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

//Crear perfil
app.post("/perfiles/crear_perfil", async (req, res) => {
    try {
        const { nombre, edad, tarjeta_credito, caducidad, cvv } = req.body;
        const nuevoPerfil = {
            nombre,
            edad: parseInt(edad),
            tarjeta_credito,
            caducidad,
            cvv
        };
        const docRef = await db.collection("perfiles").add(nuevoPerfil);
        res.json({ success: true, uid: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Obtener perfil por UID
app.get("/perfiles/perfil", async (req, res) => {
    try {
        const { uid } = req.query;
        const doc = await db.collection("perfiles").doc(uid).get();
        if (!doc.exists) return res.status(404).json({ success: false, message: "Perfil no encontrado" });
        res.json({ success: true, perfil: doc.data() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Obtener perfiles con edad mínima
app.get("/perfiles/perfiles", async (req, res) => {
    try {
        const { edad_min } = req.query;
        const snapshot = await db.collection("perfiles").where("edad", ">=", parseInt(edad_min)).get();
        const perfiles = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        res.json({ success: true, perfiles });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Crear producto
app.post("/productos/crear_producto", async (req, res) => {
    try {
        const { nombre, precio } = req.body;
        const nuevoProducto = {
            nombre,
            precio: parseFloat(precio)
        };
        const docRef = await db.collection("productos").add(nuevoProducto);
        res.json({ success: true, uid: docRef.id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Pagar producto con Stripe
app.post("/productos/pagar_producto", async (req, res) => {
    try {
        const { uid_producto, uid_usuario } = req.body;

        const usuarioRef = await db.collection("perfiles").doc(uid_usuario).get();
        if (!usuarioRef.exists) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

        const usuario = usuarioRef.data();

        const productoRef = await db.collection("productos").doc(uid_producto).get();
        if (!productoRef.exists) return res.status(404).json({ success: false, message: "Producto no encontrado" });

        const producto = productoRef.data();

        const paymentIntent = await stripe.paymentIntents.create({
            amount: producto.precio * 100,
            currency: "usd",
            payment_method_types: ["card"],
            confirm: true,
        });

        const recibo = {
            uid_producto,
            nombre_producto: producto.nombre,
            precio: producto.precio,
            status: paymentIntent.status,
            fecha: new Date().toISOString()
        };

        await db.collection("perfiles").doc(uid_usuario).collection("recibos").add(recibo);

        res.json({ success: true, message: "Pago realizado", recibo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Obtener todos los recibos
app.get("/perfiles/recibos", async (req, res) => {
    try {
        const snapshot = await db.collectionGroup("recibos").get();
        const recibos = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, recibos });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

exports.api = functions.https.onRequest(app);
