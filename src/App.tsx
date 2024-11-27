import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

// recoil
import { useRecoilValue } from "recoil";
import { loadingState } from "@src/common/recoil/loading";
// import {}

// component
import Header from "@components/Header";
import Loading from "@components/Loading";

// page
import Login from "@pages/Login";
import Callback from "@pages/Callback";
import Garden from "@pages/Garden";

function App() {
  const isLoading = useRecoilValue(loadingState);

  return (
    <div>
      <BrowserRouter>
        <Header />
        {isLoading.isLoading ? <Loading /> : null}

        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/garden" element={<Garden />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
