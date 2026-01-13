import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Github, Terminal } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Critical Aether Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReport = () => {
    const errorMsg = this.state.error ? this.state.error.toString() : 'Unknown Error';
    const stack = this.state.errorInfo ? this.state.errorInfo.componentStack : 'No stack trace';
    
    let bodyText = "## Error Report\n\n";
    bodyText += "**Error:** " + errorMsg + "\n\n";
    bodyText += "**Stack Trace:**\n```\n" + stack + "\n```";
    
    const body = encodeURIComponent(bodyText);
    const url = "https://github.com/norius/aether/issues/new?title=App+Crash+Report&body=" + body;
    
    if (window.electron) {
      window.electron.invoke('open-external', url);
    } else {
      window.open(url, '_blank');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-screen h-screen bg-[#050505] text-white p-12 overflow-hidden relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl glass-surface border-red-500/20 p-12 rounded-[40px] shadow-2xl flex flex-col items-center text-center z-10"
          >
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8">
               <AlertTriangle size={40} />
            </div>

            <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Signal Interrupted</h1>
            <p className="text-white/40 mb-8 max-w-md leading-relaxed text-sm">
              Aether encountered a critical neural link failure. The system core has been stabilized to prevent data loss.
            </p>

            <div className="w-full bg-black/60 border border-white/5 rounded-2xl p-6 mb-10 text-left overflow-hidden">
               <div className="flex items-center gap-2 text-red-400 mb-3">
                  <Terminal size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Diagnostic Log</span>
               </div>
               <div className="max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="text-xs font-mono text-white/60 leading-relaxed break-all">
                    {this.state.error?.toString() || "Runtime exception detected."}
                  </p>
               </div>
            </div>

            <div className="flex gap-4 w-full">
               <button 
                 onClick={this.handleReload}
                 className="flex-1 flex items-center justify-center gap-3 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
               >
                 <RefreshCw size={16} />
                 Reboot System
               </button>
               <button 
                 onClick={this.handleReport}
                 className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/5 text-white/60 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 hover:text-white transition-all"
               >
                 <Github size={16} />
                 Report Bug
               </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
