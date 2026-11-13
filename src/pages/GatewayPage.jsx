import React, { useState, useEffect, useRef, useCallback } from "react";
import TopBar from "../components/gateway/TopBar";
import PipelineTracker from "../components/gateway/PipelineTracker";
import OriginalDocumentPanel from "../components/gateway/PanelOriginalInput";
import SanitizedPayloadPanel from "../components/gateway/PanelOutboundSanitized";
import FinalResponsePanel from "../components/gateway/PanelFinalResponse";
import ExplainabilitySection from "../components/gateway/ExplainabilitySection";
import RiskGaugeCard from "../components/gateway/RiskGaugeCard";
import AlertsPanel from "../components/gateway/AlertsPanel";
import { SAMPLE_DOCUMENTS } from "../mockData";
import { processText, updateDepartmentPolicy } from "../api";
import { toast } from "sonner";
import { Lock, ArrowRight } from "lucide-react";
import { validateDocumentContent } from "../lib/documentValidator";

export default function GatewayPage() {
  const [department, setDepartment] = useState("Banking");
  const [task, setTask] = useState("Summarize Document");
  const [llmBackend, setLlmBackend] = useState("gemini-1.5-pro");
  const [text, setText] = useState(SAMPLE_DOCUMENTS[0].text);

  // Processing state & API response
  const [loading, setLoading] = useState(false);
  const [processedResult, setProcessedResult] = useState(null);

  // Hover sync across panels
  const [hoveredPlaceholder, setHoveredPlaceholder] = useState(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);

  // Demo mode state
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const demoTimerRef = useRef(null);

  const handleProcess = useCallback(
    async (customText, customDept, customTask, customBackend, customFilename) => {
      const textToProcess = customText !== undefined ? customText : text;
      const effectiveFilename = customFilename || uploadedFileMeta?.name || "";
      
      // Document validity & content integrity check (PC-09, PC-10, Random Garbage)
      const validation = validateDocumentContent(textToProcess, effectiveFilename);
      if (!validation.valid) {
        toast.error(validation.error, { duration: 6000 });
        return;
      }

      setLoading(true);
      try {
        const payload = {
          text: textToProcess,
          department: customDept || department,
          task: customTask || task,
          llm_backend: customBackend || llmBackend,
          filename: effectiveFilename,
        };

        const result = await processText(payload, () =>
          handleProcess(customText, customDept, customTask, customBackend, customFilename)
        );
        setProcessedResult(result);
        if (result?.is_blocking) {
          if (result?.prompt_injection?.detected) {
            toast.error("Transmission blocked: Prompt Injection Defender halted outbound request.");
          } else {
            toast.error("Transmission halted: Request violated active department DPDP policy.");
          }
        } else {
          toast.success("Document sanitized and processed successfully.");
        }
      } catch (err) {
        console.error("Processing failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [text, department, task, llmBackend, uploadedFileMeta]
  );

  // Process initial sample on mount
  useEffect(() => {
    handleProcess(
      SAMPLE_DOCUMENTS[0].text,
      SAMPLE_DOCUMENTS[0].department,
      SAMPLE_DOCUMENTS[0].task,
      llmBackend
    );
  }, []);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to process
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!loading && text) {
          handleProcess();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, text, handleProcess]);

  // Handle sample selection from dropdown
  const handleSelectSample = (sampleId) => {
    const sample = SAMPLE_DOCUMENTS.find((d) => d.id === sampleId);
    if (sample) {
      setText(sample.text);
      setDepartment(sample.department);
      setTask(sample.task);
      handleProcess(sample.text, sample.department, sample.task, llmBackend);
      toast.info(`Loaded scenario: ${sample.title}`);
    }
  };

  // Handle uploaded text/pdf file
  const handleFileUpload = (content, filename, meta = {}) => {
    setText(content);
    setUploadedFileMeta({ name: filename, ...meta });
    toast.success(`Loaded ${filename} (${content.length.toLocaleString()} characters)`);
    handleProcess(content, department, task, llmBackend, filename);
  };

  // Automated Demo Walkthrough

  // --- ZeroLeak Simulation & Auto‑Remediation ---
  const [simulationResult, setSimulationResult] = useState(null);
  const [policySuggestion, setPolicySuggestion] = useState(null);

  const runSimulation = useCallback(async () => {
    if (!processedResult?.sanitized_text) {
      toast.warning('Run the real processing first to obtain a sanitized payload.');
      return;
    }
    try {
      const { simulateLLM } = await import('../services/simulation');
      const sim = await simulateLLM(processedResult.sanitized_text);
      setSimulationResult(sim);
      // Suggest policy based on dropped placeholders
      const { suggestPolicyFromDrops } = await import('../services/remediation');
      const suggestion = suggestPolicyFromDrops(sim.droppedPlaceholders);
      setPolicySuggestion(suggestion);
      toast.success('Simulation completed – risk score: ' + sim.riskScore);
    } catch (e) {
      console.error('Simulation error', e);
      toast.error('Simulation failed');
    }
  }, [processedResult]);

  const applySuggestedPolicy = useCallback(async () => {
    if (!policySuggestion) return;
    // Merge suggestion into current department policy via API
    try {
      await updateDepartmentPolicy(department, policySuggestion);
      toast.success('Suggested policy applied');
    } catch (e) {
      console.error(e);
      toast.error('Failed to apply suggestion');
    }
  }, [policySuggestion, department]);

  const stopDemo = useCallback(() => {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    setIsDemoRunning(false);
    setDemoStep(0);
  }, []);

  const runDemoStep = useCallback(
    (stepIndex) => {
      if (stepIndex >= SAMPLE_DOCUMENTS.length) {
        toast.success("Automated demo sequence completed.");
        stopDemo();
        return;
      }

      const sample = SAMPLE_DOCUMENTS[stepIndex];
      setDemoStep(stepIndex);
      setText(sample.text);
      setDepartment(sample.department);
      setTask(sample.task);
      handleProcess(sample.text, sample.department, sample.task, llmBackend);

      toast.info(`Demo [${stepIndex + 1}/${SAMPLE_DOCUMENTS.length}]: ${sample.title}`);

      demoTimerRef.current = setTimeout(() => {
        runDemoStep(stepIndex + 1);
      }, 5000);
    },
    [handleProcess, llmBackend, stopDemo]
  );

  const toggleDemo = () => {
    if (isDemoRunning) {
      stopDemo();
      toast.info("Demo mode stopped.");
    } else {
      setIsDemoRunning(true);
      runDemoStep(0);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] font-sans">
      {/* Top Controls Bar */}
      <TopBar
        department={department}
        setDepartment={setDepartment}
        task={task}
        setTask={setTask}
        llmBackend={llmBackend}
        setLlmBackend={setLlmBackend}
        onSelectSample={handleSelectSample}
        onFileUpload={handleFileUpload}
        onClearText={() => setText("")}
        onProcess={() => handleProcess()}
        loading={loading}
        isDemoRunning={isDemoRunning}
        onToggleDemo={toggleDemo}
        hasText={Boolean(text && text.trim())}
      />

      {/* Main Workspace */}
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Gateway Architecture Boundary Diagram */}
        <div className="px-4 py-2.5 rounded-lg bg-[#141414] border border-[#2A2A2A] flex flex-wrap items-center justify-between text-xs text-[#9A9A9A] font-mono gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E5484D]" />
            <span className="text-[#F5F5F5] font-medium">Enterprise Privacy Proxy</span>
            <span>•</span>
            <span>Client/Edge Boundary Isolation Active</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#E5484D]">
              <Lock className="w-3.5 h-3.5" />
              <span>Local Map Sanitization</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <span className="text-[#9A9A9A]">External LLM Wire</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#9A9A9A]" />
            <span className="text-[#E5484D]">Local Reinsertion</span>
          </div>
        </div>

        {/* 13-Stage ZeroLeak Security Pipeline Tracker */}
        <PipelineTracker
          processedResult={processedResult}
          department={department}
          task={task}
          loading={loading}
          filename={uploadedFileMeta?.name || ""}
        />

        {/* The 3 Clearly Separated Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch min-h-[460px]">
          {/* Panel A: Original Input */}
          <OriginalDocumentPanel
            text={text}
            setText={setText}
            entities={processedResult?.entities || []}
            processed={Boolean(processedResult)}
            processedResult={processedResult}
            uploadedFileMeta={uploadedFileMeta}
            onFileUpload={handleFileUpload}
            hoveredPlaceholder={hoveredPlaceholder}
            onHoverPlaceholder={setHoveredPlaceholder}
            loading={loading}
          />

          {/* Panel B: Outbound Sanitized Wire Payload */}
          <SanitizedPayloadPanel
            sanitizedText={processedResult?.sanitized_text}
            entities={processedResult?.entities || []}
            leakCheck={processedResult?.leak_check}
            hoveredPlaceholder={hoveredPlaceholder}
            onHoverPlaceholder={setHoveredPlaceholder}
            processed={Boolean(processedResult)}
            requestId={processedResult?.request_id}
            loading={loading}
          />

          {/* Panel C: Final Restored AI Response */}
          <FinalResponsePanel
            finalResponse={processedResult?.final_response}
            entities={processedResult?.entities || []}
            model={processedResult?.model}
            latencyMs={processedResult?.latency_ms}
            isBlocked={processedResult?.is_blocking}
            processedResult={processedResult}
            hoveredPlaceholder={hoveredPlaceholder}
            onHoverPlaceholder={setHoveredPlaceholder}
            processed={Boolean(processedResult)}
            loading={loading}
          />
        </div>

        {/* Explainability, Risk Gauge & Security Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Left: Risk Gauge Card */}
          <div className="lg:col-span-5">
            <RiskGaugeCard risk={processedResult?.risk} />
          </div>

          {/* Right: Security & Compliance Alerts */}
          <div className="lg:col-span-7">
            <AlertsPanel alerts={processedResult?.alerts || []} />
          </div>
        </div>

        {/* Full-width Explainability Section */}
        <div className="pt-2">
          <ExplainabilitySection entities={processedResult?.entities || []} />
        </div>
      </div>
    </div>
  );
}
