import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// recoil
import { useRecoilValue, useRecoilState } from "recoil";
import { loadingState } from "./recoil/loading";

// component
import Header from "./components/Header";
import Loading from "./components/Loading";

function App() {
  const isLoading = useRecoilValue(loadingState);

  return (
    <div>
      <BrowserRouter>
        <Header />
        {isLoading.isLoading ? <Loading /> : null}
      </BrowserRouter>
    </div>
  );
}

export default App;
