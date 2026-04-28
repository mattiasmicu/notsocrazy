import { useEffect } from "react";

interface SchoolModeProps {
  onExit: () => void;
}

export default function SchoolMode({ onExit }: SchoolModeProps) {
  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'EXIT_SCHOOL_MODE') {
        onExit();
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onExit]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-white overflow-auto"
      style={{ 
        width: '100vw', 
        height: '100vh',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <iframe
        src="/classroom.html"
        className="border-0"
        title="Google Classroom"
        sandbox="allow-scripts allow-same-origin allow-popups"
        style={{
          width: '100%',
          minWidth: '1024px', // Minimum width to ensure Google Classroom layout works
          height: '100%',
          minHeight: '100vh'
        }}
      />
    </div>
  );
}
