"use client";

import { useState, useEffect, useCallback } from "react";
import { useCamera } from "@/hooks/use-camera";
import { useAttendanceRecognition, RecognitionTemplate } from "@/hooks/use-attendance-recognition";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, UserCheck, AlertCircle, RefreshCw } from "lucide-react";

type Schedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  course: { code: string; name: string };
  classroom: { name: string; location: string | null };
  lecturer: { user: { name: string } };
};

type AttendanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  status: string;
  recognizedAt: string;
};

// Helper for formatting date
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function AttendanceRecordContent() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  
  // YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState<string>(todayStr);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 1);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<RecognitionTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [recordStatus, setRecordStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [pausedRecognition, setPausedRecognition] = useState(false); 

  const { videoRef, isActive: isCameraActive, isLoading: isCameraLoading, error: cameraError, startCamera, stopCamera } = useCamera();
  const { canvasRef, isModelReady, result } = useAttendanceRecognition(videoRef, isCameraActive, templates);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const res = await fetch("/api/attendance/schedules");
        if (!res.ok) throw new Error("Failed to load schedules");
        const data = await res.json();
        setSchedules(data.schedules || []);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load schedules");
        }
      } finally {
        setLoadingSchedules(false);
      }
    }
    fetchSchedules();
  }, []);

  const refreshAttendanceList = useCallback(async (scheduleId: string, d: string) => {
    if (!scheduleId || !d) return;
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/attendance/list?classScheduleId=${scheduleId}&date=${d}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceList(data.attendances || []);
      }
    } catch (err) {
      console.error("Failed to load attendance list", err);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      if (!selectedScheduleId || !date) {
        if (!ignore) {
          setTemplates([]);
          setAttendanceList([]);
        }
        return;
      }
      setLoadingTemplates(true);
      setError(null);
      setRecordStatus(null);
      try {
        const tmplRes = await fetch(`/api/attendance/templates?classScheduleId=${selectedScheduleId}`);
        if (ignore) return;
        if (!tmplRes.ok) {
          const errData = await tmplRes.json();
          throw new Error(errData.error || "Failed to load templates");
        }
        const tmplData = await tmplRes.json();
        if (ignore) return;
        setTemplates(tmplData.templates || []);

        await refreshAttendanceList(selectedScheduleId, date);
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An error occurred");
          }
        }
      } finally {
        if (!ignore) setLoadingTemplates(false);
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [selectedScheduleId, date, refreshAttendanceList]);

  const handleRecordAttendance = async () => {
    if (!selectedScheduleId || !date) return;
    if (result.state !== "recognized" || !result.studentDbId) return;

    setRecording(true);
    setRecordStatus(null);
    try {
      const res = await fetch("/api/attendance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDbId: result.studentDbId,
          classScheduleId: selectedScheduleId,
          date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record attendance");

      if (data.created) {
        setRecordStatus({ type: "success", message: `Attendance recorded for ${result.studentName}.` });
      } else {
        setRecordStatus({ type: "info", message: `Already recorded today for ${result.studentName}.` });
      }

      setPausedRecognition(true);
      setTimeout(() => setPausedRecognition(false), 2500);

      refreshAttendanceList(selectedScheduleId, date);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRecordStatus({ type: "error", message: err.message });
      } else {
        setRecordStatus({ type: "error", message: "An error occurred" });
      }
      setPausedRecognition(true);
      setTimeout(() => setPausedRecognition(false), 2500);
    } finally {
      setRecording(false);
    }
  };

  const isMatch = result.state === "recognized" && result.studentDbId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Controls & Session Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Session Selection</h3>
            <p className="text-sm text-muted-foreground mt-1">Select a class and date to record attendance.</p>
          </div>
          
          {error && (
            <div className="border border-destructive/50 text-destructive bg-destructive/10 rounded-lg p-3 flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Class Schedule</label>
            {loadingSchedules ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : (
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedScheduleId} 
                onChange={(e) => setSelectedScheduleId(e.target.value)}
              >
                <option value="">Select a schedule</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.course.code} - {s.dayOfWeek} {s.startTime}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={date}
              max={maxDateStr}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {selectedScheduleId && (
            <div className="mt-4 p-4 rounded-lg bg-muted text-sm space-y-1">
              {(() => {
                const s = schedules.find((s) => s.id === selectedScheduleId);
                if (!s) return null;
                return (
                  <>
                    <div className="font-semibold">{s.course.code}: {s.course.name}</div>
                    <div>Room: {s.classroom.name}</div>
                    <div>Lecturer: {s.lecturer.user.name}</div>
                    <div>Time: {s.startTime} - {s.endTime}</div>
                    <div className="pt-2 text-muted-foreground">
                      {loadingTemplates ? (
                        <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading enrolled students...</span>
                      ) : (
                        `${templates.length} student(s) enrolled and ready for recognition.`
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {selectedScheduleId && (
          <div className="border border-border bg-card rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold leading-none tracking-tight">Recent Attendance</h3>
              <Button variant="ghost" size="icon" onClick={() => refreshAttendanceList(selectedScheduleId, date)} disabled={loadingAttendance}>
                <RefreshCw className={`h-4 w-4 ${loadingAttendance ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div>
              {attendanceList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No records yet for this date.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {attendanceList.map((a) => (
                    <div key={a.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{a.studentName}</span>
                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-emerald-500 text-primary-foreground shadow hover:bg-emerald-600/80">
                          {a.status}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground text-xs">
                        <span>{a.studentId}</span>
                        <span>{formatDate(a.recognizedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Camera & Recognition */}
      <div className="lg:col-span-2 space-y-6">
        <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
          <div className="bg-muted/50 border-b p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Live Recognition
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Require exactly one face in clear view to record.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!isCameraActive ? (
                  <Button onClick={startCamera} disabled={isCameraLoading || !selectedScheduleId || loadingTemplates}>
                    {isCameraLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start Camera
                  </Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera}>
                    Stop Camera
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="p-0 relative bg-black min-h-[400px] flex items-center justify-center">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-[600px] object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
                  {(recordStatus && pausedRecognition) ? (
                    <div className={`rounded-lg border px-4 py-3 text-sm font-medium text-center shadow-lg ${
                      recordStatus.type === "success" ? "bg-emerald-500 border-emerald-600 text-white" :
                      recordStatus.type === "error" ? "bg-red-500 border-red-600 text-white" :
                      "bg-blue-500 border-blue-600 text-white"
                    }`}>
                      {recordStatus.message}
                    </div>
                  ) : (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-xl p-4 shadow-xl flex flex-col gap-3">
                      <div className="text-center">
                        <p className="font-semibold">
                          {!isModelReady ? "Loading AI models..." : result.statusMessage}
                        </p>
                        {isMatch && (
                          <p className="text-sm text-muted-foreground">
                            {result.studentId} • Match Confidence: {result.confidenceLabel}
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        size="lg" 
                        className="w-full font-bold text-lg"
                        disabled={!isMatch || recording || pausedRecognition}
                        onClick={handleRecordAttendance}
                      >
                        {recording ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Recording...</>
                        ) : (
                          <><UserCheck className="mr-2 h-5 w-5" /> Record Attendance</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-4">
                <Camera className="h-12 w-12 opacity-20" />
                {cameraError ? (
                  <span className="text-destructive text-center max-w-xs">{cameraError}</span>
                ) : (
                  <span>Camera is off.</span>
                )}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-card">
            <p className="text-xs text-muted-foreground text-center">
              Live camera frames and descriptors stay local. Enrolled templates are loaded securely for local matching. No raw camera data is stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
