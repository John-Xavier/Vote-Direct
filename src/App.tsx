import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Signup } from './pages/Signup';
import { Layout } from './components/Layout';
import { Ballot } from './pages/Ballot';
import { PollPage } from './pages/PollPage';
import { CandidateProfile } from './pages/CandidateProfile';
import { BecomeCandidate } from './pages/BecomeCandidate';
import { Approvals } from './pages/Approvals';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { CoalitionView } from './pages/CoalitionView';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/signup', element: <Signup /> },
  {
    path: '/app',
    element: <Layout />,
    children: [
      { index: true, element: <Ballot /> },
      { path: 'poll/:pollId', element: <PollPage /> },
      { path: 'candidate/:candidacyId', element: <CandidateProfile /> },
      { path: 'become-candidate', element: <BecomeCandidate /> },
      { path: 'approvals', element: <Approvals /> },
      { path: 'profile', element: <Profile /> },
      { path: 'admin', element: <AdminPanel /> },
      { path: 'coalition', element: <CoalitionView /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
