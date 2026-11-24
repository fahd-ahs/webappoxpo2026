import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import StudyCompanionWorkspace from '../../components/ai/StudyCompanionWorkspace';

export default function AICompanion() {
  const location = useLocation();
  const launchState = location.state || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      data-testid="ai-companion-page"
      className="max-w-6xl mx-auto"
    >
      <StudyCompanionWorkspace variant="page" externalLaunch={launchState} />
    </motion.div>
  );
}
