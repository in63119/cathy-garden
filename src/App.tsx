import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// recoil
import { useRecoilValue } from "recoil";
import { loadingState } from "@recoil/loading";

// component
import Header from "@components/Header";
import Loading from "@components/Loading";

// page
import Login from "@pages/Login";

function App() {
  const isLoading = useRecoilValue(loadingState);

  return (
    <div>
      <BrowserRouter>
        <Header />
        {isLoading.isLoading ? <Loading /> : null}

        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
