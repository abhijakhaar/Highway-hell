import { Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage"; // Import your edit profile component
import PageLayout from "./Layouts/PageLayout/PageLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CreateTripPage from "./pages/CreateTripPage";
import TripPage from "./pages/TripPage";
import SearchPage from "./pages/SearchPage";
import ParticipantMap from "./pages/participantMap";

function AuthenticatedApp() {
  const { currentUser } = useAuth();

  const ProfileRedirect = () => {
    return <Navigate to={`/profile/${currentUser?._id}`} replace />;
  };

  return (
    <PageLayout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={currentUser ? <ProfileRedirect /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={currentUser ? <ProfileRedirect /> : <SignupPage />}
        />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/createTrip" element={<CreateTripPage />} />
        <Route path="/trip/:id" element={<TripPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/trip/:tripId/map/:username/"
          element={<ParticipantMap />}
        />
      </Routes>
    </PageLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
