import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { PageUrls } from "@common/constants/page-urls";

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
          <Route
            path={PageUrls.INTRO}
            element={<Navigate to={PageUrls.AUTH.LOGIN} replace />}
          />
          <Route path={PageUrls.AUTH.LOGIN} element={<Login />} />
          <Route path={PageUrls.AUTH.CALLBACK} element={<Callback />} />
          <Route path={PageUrls.HOUSE.GARDEN} element={<Garden />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
