import React from "react"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import styles from "./assets/css/App.module.css"

import Header from "./pages/Header"
import Footer from "./pages/Footer"

import Home from "./pages/Home"
import Shop from "./pages/Shop"



function App() {

  return (
    <div className={styles["all"]}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}


function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>  );
}

export default AppWrapper;