import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppProvider from "./store/AppProvider";
import Shell, { Toast } from "./components/Shell";
import Today from "./pages/Today";
import System from "./pages/System";
import Cards from "./pages/Cards";
import Journeys from "./pages/Journeys";
import JourneyEdit from "./pages/JourneyEdit";
import Train from "./pages/Train";
import CodeDrill from "./pages/CodeDrill";
import JourneyDrill from "./pages/JourneyDrill";
import NumbersEvent from "./pages/NumbersEvent";
import CardsEvent from "./pages/CardsEvent";
import Progress from "./pages/Progress";
import Guide from "./pages/Guide";
import Data from "./pages/Data";

function Focus({ children }) {
  return <>{children}<Toast /></>;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/memory">
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Today />} />
            <Route path="/system" element={<System />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/journeys" element={<Journeys />} />
            <Route path="/journeys/:id" element={<JourneyEdit />} />
            <Route path="/train" element={<Train />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/data" element={<Data />} />
          </Route>
          <Route path="/drill/codes" element={<Focus><CodeDrill /></Focus>} />
          <Route path="/drill/journey" element={<Focus><JourneyDrill /></Focus>} />
          <Route path="/event/numbers" element={<Focus><NumbersEvent /></Focus>} />
          <Route path="/event/cards" element={<Focus><CardsEvent /></Focus>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
