import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../lib/api';
import { ROUTES } from '../../lib/routes';
import { ASSETS } from '../../lib/assets';
import './Dashboard.css';

const ADMIN_MODULES = [
  { key: 'clientes', label: 'Clientes' },
  { key: 'bandeja', label: 'Bandeja' },
  { key: 'trabajos', label: 'Trabajos' },
  { key: 'calendario', label: 'Calendario' },
  { key: 'empleados', label: 'Empleados' },
  { key: 'auditoria-legal', label: 'Auditoria legal' },
  { key: 'rentabilidad', label: 'Rentabilidad' },
];

const EMPLOYEE_MODULES = [
  { key: 'mi-agenda', label: 'Mi dia' },
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
];

const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 21;
const SLOT_MINUTES = 15;
const CALENDAR_SLOTS = Array.from({ length: ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60) / SLOT_MINUTES }, (_, index) => {
  const totalMinutes = CALENDAR_START_HOUR * 60 + index * SLOT_MINUTES;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return { hour, minute, value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
});

const SLOT_INDEX_BY_TIME = CALENDAR_SLOTS.reduce((acc, slot, index) => {
  acc[`${slot.hour}-${slot.minute}`] = index;
  return acc;
}, {});

const JOB_DRAG_MIME = 'application/x-ezlo-job';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function dateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(baseDate, days) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function normalizeDay(baseDate) {
  const day = new Date(baseDate);
  day.setHours(0, 0, 0, 0);
  return day;
}

function slotLabel(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function dayChipLabel(value) {
  return new Date(value).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function fullDateLabel(value) {
  return new Date(value).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function weekdayLabelFromNumber(value) {
  const found = WEEKDAY_OPTIONS.find((item) => Number(item.value) === Number(value));
  return found ? found.label : '';
}

function requiredPeopleOf(trabajo) {
  return trabajo?.personas_requeridas_resuelta || trabajo?.personas_requeridas || 1;
}

function getDragPayload(event) {
  const types = Array.from(event?.dataTransfer?.types || []);
  if (!types.includes(JOB_DRAG_MIME)) return null;

  try {
    const raw = event.dataTransfer.getData(JOB_DRAG_MIME);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.type !== 'pending' && parsed.type !== 'assignment')) return null;

    const idTrabajo = Number(parsed.id_trabajo);
    if (!idTrabajo) return null;

    if (parsed.type === 'assignment') {
      const idAsignacion = Number(parsed.id_asignacion);
      if (!idAsignacion) return null;
      return { type: 'assignment', id_trabajo: idTrabajo, id_asignacion: idAsignacion };
    }

    return { type: 'pending', id_trabajo: idTrabajo };
  } catch {
    return null;
  }
}

function hourFromDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toNumeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatMinutes(totalMinutes) {
  const safe = Number(totalMinutes || 0);
  if (!safe) return '0m';
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function diffMinutesSafe(fromValue, toValue) {
  if (!fromValue || !toValue) return 0;
  const from = new Date(fromValue);
  const to = new Date(toValue);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 60000));
}

function normalizeEstadoTrabajo(estado) {
  if (!estado) return 'pendiente';
  const normalized = String(estado).toLowerCase();
  if (normalized === 'programado') return 'pendiente';
  if (normalized === 'completado') return 'finalizado';
  return normalized;
}

function estadoTrabajoLabel(estado) {
  const normalized = normalizeEstadoTrabajo(estado);
  if (normalized === 'en_curso') return 'En curso';
  if (normalized === 'pausado') return 'Pausado';
  if (normalized === 'finalizado') return 'Finalizado';
  return 'Pendiente';
}

function desviacionTone(value) {
  const minutes = Number(value || 0);
  if (minutes <= -15) return { key: 'positive', label: 'Adelantado' };
  if (minutes >= 15) return { key: 'negative', label: 'Retraso' };
  return { key: 'neutral', label: 'En objetivo' };
}

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildRangeFromPreset(mode, amount, customFrom, customTo) {
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  if (mode === 'custom') {
    return {
      desde: customFrom || '',
      hasta: customTo || '',
    };
  }

  const safeAmount = Math.max(1, Number(amount || 1));
  const start = new Date(end);

  if (mode === 'dias') {
    start.setDate(start.getDate() - (safeAmount - 1));
  } else if (mode === 'meses') {
    start.setMonth(start.getMonth() - safeAmount);
    start.setDate(start.getDate() + 1);
  } else {
    start.setFullYear(start.getFullYear() - safeAmount);
    start.setDate(start.getDate() + 1);
  }

  return {
    desde: toISODate(start),
    hasta: toISODate(end),
  };
}

function parseInboxMessage(raw) {
  const lines = String(raw || '').split('\n').map((line) => line.trim());
  const tipoLine = lines.find((line) => line.toLowerCase().startsWith('tipo de consulta:'));
  const telefonoLine = lines.find((line) => line.toLowerCase().startsWith('telefono:'));

  const tipo = tipoLine ? tipoLine.split(':').slice(1).join(':').trim() : '';
  const telefono = telefonoLine ? telefonoLine.split(':').slice(1).join(':').trim() : '';

  const bodyLines = lines.filter((line) => {
    const normalized = line.toLowerCase();
    return normalized && !normalized.startsWith('tipo de consulta:') && !normalized.startsWith('telefono:');
  });

  return {
    tipo,
    telefono,
    mensaje: bodyLines.join('\n').trim() || String(raw || '').trim(),
  };
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('ezlo_token');

  const response = await fetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('ezlo_user');
      localStorage.removeItem('ezlo_token');
      throw new Error('Sesion caducada. Vuelve a iniciar sesion.');
    }

    const rawMessage = String(data?.message || '');
    const leakedTechnicalError =
      rawMessage.includes('SQLSTATE') ||
      rawMessage.includes('Integrity constraint violation') ||
      rawMessage.includes('Connection: mysql') ||
      rawMessage.includes('Database:') ||
      rawMessage.includes('`updated_at`');

    if (leakedTechnicalError) {
      if (import.meta.env.DEV) {
        throw new Error(rawMessage || 'Error de base de datos');
      }
      throw new Error('No se pudo completar la operacion por un conflicto de datos.');
    }

    throw new Error(rawMessage || 'Error de servidor');
  }

  return data;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('clientes');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [clientes, setClientes] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [trabajos, setTrabajos] = useState([]);
  const [plantillasTrabajo, setPlantillasTrabajo] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loadedModules, setLoadedModules] = useState({
    clientes: false,
    bandeja: false,
    calendario: false,
    plantillas: false,
    empleados: false,
    perfil: false,
    jornada: false,
    auditoria: false,
    rentabilidad: false,
  });
  const [draggingJobId, setDraggingJobId] = useState(null);
  const [selectedPendingJobId, setSelectedPendingJobId] = useState(null);
  const [dragOverKey, setDragOverKey] = useState('');
  const [dragOverRangeKeys, setDragOverRangeKeys] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => normalizeDay(new Date()));
  const [calendarEmpleadoPage, setCalendarEmpleadoPage] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [completingTrabajoId, setCompletingTrabajoId] = useState(null);
  const [undoAction, setUndoAction] = useState(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [formNotifications, setFormNotifications] = useState([]);
  const [pendingInboxCount, setPendingInboxCount] = useState(0);
  const [acknowledgedInboxCount, setAcknowledgedInboxCount] = useState(0);
  const pendingInboxCountRef = useRef(0);
  const inboxPollingReadyRef = useRef(false);
  const dragPayloadRef = useRef(null);
  const dashboardMainRef = useRef(null);
  const [trabajoForm, setTrabajoForm] = useState({
    id_cliente: '',
    descripcion_tarea: '',
    duracion_minutos: '60',
    personas_requeridas: '',
    ubicacion: '',
    observaciones: '',
  });
  const [plantillaForm, setPlantillaForm] = useState({
    nombre: '',
    id_cliente: '',
    descripcion_tarea: '',
    duracion_minutos: '60',
    personas_requeridas: '',
    dia_semana: '',
    ubicacion: '',
    observaciones: '',
  });
  const [programarDiasConsecutivos, setProgramarDiasConsecutivos] = useState('1');
  const [programarHoraInicio, setProgramarHoraInicio] = useState('08:00');
  const [programarFechaBase, setProgramarFechaBase] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    nombre: '',
    apellidos: '',
    username: '',
    password: '',
    rol: 'Empleado',
  });
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    apellidos: '',
    username: '',
    password: '',
  });
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');
  const [removeProfileAvatar, setRemoveProfileAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [needsPeopleReminder, setNeedsPeopleReminder] = useState(false);
  const [jornadaActual, setJornadaActual] = useState(null);
  const [isSavingJornada, setIsSavingJornada] = useState(false);
  const [isUpdatingTrabajo, setIsUpdatingTrabajo] = useState(false);
  const [finalizeModal, setFinalizeModal] = useState({
    open: false,
    trabajo: null,
    tiempoEstimado: 0,
    tiempoRealEfectivo: 0,
    notas: '',
  });
  const [editRetrasoModal, setEditRetrasoModal] = useState({
    open: false,
    id: null,
    cliente: '',
    empleado: '',
    tiempo_estimado: 0,
    tiempo_real_efectivo: 0,
    notas_empleado: '',
    motivo_ajuste: '',
  });
  const [isSavingRetrasoEdit, setIsSavingRetrasoEdit] = useState(false);
  const [auditoriaJornadas, setAuditoriaJornadas] = useState([]);
  const [auditoriaAjustesTrabajos, setAuditoriaAjustesTrabajos] = useState([]);
  const [eficienciaEmpleados, setEficienciaEmpleados] = useState([]);
  const [desviacionClientes, setDesviacionClientes] = useState([]);
  const [rangeMode, setRangeMode] = useState('meses');
  const [rangeAmount, setRangeAmount] = useState('3');
  const [customRangeFrom, setCustomRangeFrom] = useState('');
  const [customRangeTo, setCustomRangeTo] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [mobileAssignEmpleadoId, setMobileAssignEmpleadoId] = useState('');
  const [mobileFilterEmpleadoId, setMobileFilterEmpleadoId] = useState('');
  const [mobileAssignSlot, setMobileAssignSlot] = useState('08:00');
  const [mobileEditingAsignacionId, setMobileEditingAsignacionId] = useState(null);
  const [mobileEditEmpleadoId, setMobileEditEmpleadoId] = useState('');
  const [mobileEditSlot, setMobileEditSlot] = useState('08:00');
  const [isCompactCalendarView, setIsCompactCalendarView] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 860 : false));
  const [employeeAgendaFilter, setEmployeeAgendaFilter] = useState('todos');

  const [editClienteId, setEditClienteId] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const storedUser = localStorage.getItem('ezlo_user');
  const storedToken = localStorage.getItem('ezlo_token');
  if (!storedUser || !storedToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  let user = null;
  try {
    user = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('ezlo_user');
    localStorage.removeItem('ezlo_token');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!['Admin', 'Empleado'].includes(user.rol)) {
    localStorage.removeItem('ezlo_user');
    localStorage.removeItem('ezlo_token');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const isAdmin = user.rol === 'Admin';
  const modules = isAdmin ? ADMIN_MODULES : EMPLOYEE_MODULES;
  const defaultModule = isAdmin ? 'clientes' : 'mi-agenda';

  const scrollDashboardToTop = (smooth = true) => {
    const behavior = smooth ? 'smooth' : 'auto';
    dashboardMainRef.current?.scrollTo({ top: 0, behavior });
    window.scrollTo({ top: 0, behavior });
  };

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [activeModule]);

  useEffect(() => {
    const onResize = () => {
      setIsCompactCalendarView(window.innerWidth <= 860);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onNavModuleSelect = (moduleKey) => {
    setActiveModule(moduleKey);
    setIsNotificationPanelOpen(false);
    requestAnimationFrame(() => scrollDashboardToTop(true));
  };

  const handleLogout = () => {
    localStorage.removeItem('ezlo_user');
    localStorage.removeItem('ezlo_token');
    navigate(ROUTES.LOGIN);
  };

  const onOpenProfile = () => {
    setActiveModule('perfil');
    setIsNotificationPanelOpen(false);
    requestAnimationFrame(() => scrollDashboardToTop(true));
  };

  const clearFeedback = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setErrorMessage('');
  };

  const showError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  const pushFormNotification = (type, text) => {
    setFormNotifications((prev) => {
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        text,
      };
      return [item, ...prev].slice(0, 10);
    });
  };

  const removeFormNotification = (id) => {
    setFormNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const fetchClientes = async () => {
    const data = await apiRequest('/api/clientes');
    setClientes(data);
  };

  const fetchMensajes = async () => {
    const data = await apiRequest('/api/formularios');
    setMensajes(data);
  };

  const fetchTrabajos = async () => {
    const data = await apiRequest('/api/trabajos');
    setTrabajos(data);
  };

  const fetchPlantillasTrabajo = async () => {
    const data = await apiRequest('/api/trabajos-plantillas');
    setPlantillasTrabajo(data);
  };

  const fetchUsuarios = async () => {
    const data = await apiRequest('/api/usuarios');
    setUsuarios(data);
  };

  const fetchJornadaActual = async () => {
    if (isAdmin) {
      setJornadaActual(null);
      return;
    }
    const data = await apiRequest('/api/jornada/actual');
    setJornadaActual(data?.registro || null);
  };

  const fetchAuditoriaJornadas = async () => {
    const range = buildRangeFromPreset(rangeMode, rangeAmount, customRangeFrom, customRangeTo);
    const params = new URLSearchParams();
    if (range.desde) params.set('desde', range.desde);
    if (range.hasta) params.set('hasta', range.hasta);

    const data = await apiRequest(`/api/jornada/auditoria${params.toString() ? `?${params.toString()}` : ''}`);
    setAuditoriaJornadas(Array.isArray(data) ? data : []);
  };

  const fetchAuditoriaAjustesTrabajos = async () => {
    const range = buildRangeFromPreset(rangeMode, rangeAmount, customRangeFrom, customRangeTo);
    const params = new URLSearchParams();
    if (range.desde) params.set('desde', range.desde);
    if (range.hasta) params.set('hasta', range.hasta);

    const data = await apiRequest(`/api/trabajos/auditoria-ajustes${params.toString() ? `?${params.toString()}` : ''}`);
    setAuditoriaAjustesTrabajos(Array.isArray(data) ? data : []);
  };

  const fetchRentabilidad = async () => {
    const range = buildRangeFromPreset(rangeMode, rangeAmount, customRangeFrom, customRangeTo);
    const params = new URLSearchParams();
    if (range.desde) params.set('desde', range.desde);
    if (range.hasta) params.set('hasta', range.hasta);
    const query = params.toString() ? `?${params.toString()}` : '';

    const [empleadosData, clientesData] = await Promise.all([
      apiRequest(`/api/analitica/eficiencia-empleados${query}`),
      apiRequest(`/api/analitica/desviacion-clientes${query}`),
    ]);
    setEficienciaEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
    setDesviacionClientes(Array.isArray(clientesData) ? clientesData : []);
  };

  const updateStoredUser = (patch) => {
    const nextUser = { ...user, ...patch };
    localStorage.setItem('ezlo_user', JSON.stringify(nextUser));
    return nextUser;
  };

  const fetchProfile = async () => {
    const data = await apiRequest(`/api/usuarios/${user.id_usuario}`);

    setProfileForm({
      nombre: data.nombre || '',
      apellidos: data.apellidos || '',
      username: data.username || '',
      password: '',
    });
    setProfileAvatarFile(null);
    setProfileAvatarPreview('');
    setRemoveProfileAvatar(false);

    updateStoredUser({
      nombre: data.nombre || '',
      apellidos: data.apellidos || '',
      username: data.username || '',
      avatar_url: data.avatar_url || null,
      rol: data.rol || user.rol,
    });
  };

  const refreshPendingInboxCount = async () => {
    if (!isAdmin) return;
    try {
      const data = await apiRequest('/api/formularios?estado=Pendiente');
      const nextCount = Array.isArray(data) ? data.length : 0;
      setPendingInboxCount(nextCount);

      if (inboxPollingReadyRef.current && nextCount > pendingInboxCountRef.current) {
        const diff = nextCount - pendingInboxCountRef.current;
        const text = diff === 1
          ? 'Ha llegado 1 formulario nuevo a la bandeja.'
          : `Han llegado ${diff} formularios nuevos a la bandeja.`;
        pushFormNotification('info', text);
      }

      pendingInboxCountRef.current = nextCount;
      inboxPollingReadyRef.current = true;
    } catch {
    }
  };

  const loadModuleData = async (moduleKey, options = {}) => {
    const { force = false, showLoader = true } = options;
    const tasks = [];
    const moduleFlags = {};

    const queue = (key, taskFn) => {
      if (force || !loadedModules[key]) {
        moduleFlags[key] = true;
        tasks.push(taskFn());
      }
    };

    if (moduleKey === 'clientes') {
      queue('clientes', fetchClientes);
    } else if (moduleKey === 'bandeja') {
      queue('bandeja', fetchMensajes);
    } else if (moduleKey === 'calendario') {
      queue('clientes', fetchClientes);
      queue('calendario', fetchTrabajos);
      queue('plantillas', fetchPlantillasTrabajo);
      queue('empleados', fetchUsuarios);
    } else if (moduleKey === 'trabajos') {
      queue('clientes', fetchClientes);
      queue('calendario', fetchTrabajos);
      queue('plantillas', fetchPlantillasTrabajo);
    } else if (moduleKey === 'empleados') {
      queue('empleados', fetchUsuarios);
    } else if (moduleKey === 'mi-agenda') {
      queue('calendario', fetchTrabajos);
      queue('jornada', fetchJornadaActual);
    } else if (moduleKey === 'perfil') {
      queue('perfil', fetchProfile);
    } else if (moduleKey === 'auditoria-legal') {
      queue('calendario', fetchTrabajos);
      queue('auditoria', fetchAuditoriaJornadas);
      queue('auditoria-ajustes', fetchAuditoriaAjustesTrabajos);
    } else if (moduleKey === 'rentabilidad') {
      queue('rentabilidad', fetchRentabilidad);
    }

    if (tasks.length === 0) return;

    if (showLoader) {
      setIsLoading(true);
      clearFeedback();
    }

    try {
      await Promise.all(tasks);
      setLoadedModules((prev) => ({ ...prev, ...moduleFlags }));
    } catch (error) {
      showError(error.message || 'No se pudieron cargar los datos');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData(defaultModule, { force: true, showLoader: true });
  }, []);

  useEffect(() => {
    const isAllowedModule = activeModule === 'perfil' || modules.some((item) => item.key === activeModule);
    if (!isAllowedModule) return;
    loadModuleData(activeModule, { showLoader: true });
  }, [activeModule]);

  useEffect(() => {
    const isAllowedModule = activeModule === 'perfil' || modules.some((item) => item.key === activeModule);
    if (!isAllowedModule) {
      onNavModuleSelect(defaultModule);
    }
  }, [activeModule, defaultModule, modules]);

  useEffect(() => {
    if (!profileAvatarFile) {
      setProfileAvatarPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profileAvatarFile);
    setProfileAvatarPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [profileAvatarFile]);

  useEffect(() => {
    setProfileForm((prev) => ({
      ...prev,
      nombre: user.nombre || '',
      apellidos: user.apellidos || '',
      username: user.username || '',
      password: '',
    }));
  }, [user.id_usuario, user.nombre, user.apellidos, user.username]);

  useEffect(() => {
    if (!undoAction) return undefined;

    const timeoutId = setTimeout(() => {
      setUndoAction(null);
    }, 7000);

    return () => clearTimeout(timeoutId);
  }, [undoAction]);

  useEffect(() => {
    if (!errorMessage) return undefined;
    const timeoutId = setTimeout(() => setErrorMessage(''), 4200);
    return () => clearTimeout(timeoutId);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeoutId = setTimeout(() => setSuccessMessage(''), 3200);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    const intervalId = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    refreshPendingInboxCount();
    const intervalId = setInterval(() => {
      refreshPendingInboxCount();
    }, 20000);

    return () => clearInterval(intervalId);
  }, [isAdmin]);

  const filteredClientes = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((cliente) => {
      return [cliente.nombre, cliente.telefono, cliente.email, cliente.direccion]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [clientes, searchText]);

  const filteredMensajes = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return mensajes;
    return mensajes.filter((mensaje) => {
      return [mensaje.remitente_nombre, mensaje.remitente_email, mensaje.cuerpo_mensaje, mensaje.estado]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [mensajes, searchText]);

  const filteredEmpleados = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const base = usuarios;
    if (!q) return base;
    return base.filter((empleado) => {
      return [empleado.username, empleado.nombre, empleado.apellidos, empleado.rol]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [usuarios, searchText]);

  const EMPLEADOS_POR_PAGINA = 7;

  const empleados = useMemo(() => {
    const list = usuarios.filter((usuario) => usuario.rol === 'Empleado');
    return list;
  }, [usuarios]);

  const totalCalendarPages = Math.ceil(empleados.length / EMPLEADOS_POR_PAGINA) || 1;

  const empleadosPaginados = useMemo(() => {
    const start = calendarEmpleadoPage * EMPLEADOS_POR_PAGINA;
    return empleados.slice(start, start + EMPLEADOS_POR_PAGINA);
  }, [empleados, calendarEmpleadoPage]);

  useEffect(() => {
    if (!mobileAssignEmpleadoId && empleados.length > 0) {
      setMobileAssignEmpleadoId(String(empleados[0].id_usuario));
    }
  }, [empleados, mobileAssignEmpleadoId]);

  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);

  const calendarNowIndicator = useMemo(() => {
    const now = new Date(nowTick);
    if (dateKey(now) !== selectedDateKey) return null;

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const startMinutes = CALENDAR_START_HOUR * 60;
    const endMinutes = CALENDAR_END_HOUR * 60;
    if (minutesNow < startMinutes || minutesNow > endMinutes) return null;

    return {
      minutesFromStart: minutesNow - startMinutes,
      label: hourFromDate(now),
    };
  }, [nowTick, selectedDateKey]);

  const jobsByEmployeeSlot = useMemo(() => {
    const grouped = {};
    trabajos.forEach((trabajo) => {
      const asignaciones = Array.isArray(trabajo.asignaciones) ? trabajo.asignaciones : [];
      asignaciones.forEach((asignacion) => {
        if (!asignacion.id_empleado || !asignacion.fecha_inicio) return;
        const start = new Date(asignacion.fecha_inicio);
        if (Number.isNaN(start.getTime())) return;
        if (dateKey(start) !== selectedDateKey) return;
        const end = asignacion.fecha_fin
          ? new Date(asignacion.fecha_fin)
          : new Date(start.getTime() + Math.max((trabajo.duracion_minutos || 60) * 60 * 1000, SLOT_MINUTES * 60 * 1000));
        if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) return;

        const slotSpan = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (SLOT_MINUTES * 60 * 1000)));
        let cursor = new Date(start);
        let isStartSlot = true;
        while (cursor.getTime() < end.getTime()) {
          const key = `${asignacion.id_empleado}-${cursor.getHours()}-${cursor.getMinutes()}`;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({
            ...trabajo,
            __asignacion: asignacion,
            __slotStart: isStartSlot,
            __slotSpan: slotSpan,
          });
          cursor = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);
          isStartSlot = false;
        }
      });
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.__asignacion.fecha_inicio).getTime() - new Date(b.__asignacion.fecha_inicio).getTime());
    });

    return grouped;
  }, [trabajos, selectedDateKey]);

  const dayStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3));
  }, [selectedDate]);

  const pendingJobs = useMemo(() => {
    const selectedWeekday = new Date(selectedDate).getDay();
    return trabajos.filter((trabajo) => {
      const asignadas = Array.isArray(trabajo.asignaciones) ? trabajo.asignaciones.length : 0;
      if (asignadas >= requiredPeopleOf(trabajo)) return false;

      if (trabajo.fecha_inicio) {
        return dateKey(trabajo.fecha_inicio) === selectedDateKey;
      }

      if (trabajo.dia_semana !== null && trabajo.dia_semana !== undefined && trabajo.dia_semana !== '') {
        return Number(trabajo.dia_semana) === selectedWeekday;
      }

      return true;
    });
  }, [trabajos, selectedDate, selectedDateKey]);

  const mobileCalendarRows = useMemo(() => {
    const rows = [];
    trabajos.forEach((trabajo) => {
      const asignaciones = Array.isArray(trabajo.asignaciones) ? trabajo.asignaciones : [];
      asignaciones.forEach((asignacion) => {
        if (!asignacion.fecha_inicio) return;
        const start = new Date(asignacion.fecha_inicio);
        if (Number.isNaN(start.getTime())) return;
        if (dateKey(start) !== selectedDateKey) return;

        const end = asignacion.fecha_fin ? new Date(asignacion.fecha_fin) : null;
        const empleadoNombre = `${asignacion.empleado?.nombre || ''} ${asignacion.empleado?.apellidos || ''}`.trim()
          || asignacion.empleado?.username
          || `Empleado #${asignacion.id_empleado}`;

        rows.push({
          trabajo,
          asignacion,
          empleadoNombre,
          start,
          end,
        });
      });
    });

    rows.sort((a, b) => a.start.getTime() - b.start.getTime());
    return rows;
  }, [trabajos, selectedDateKey]);

  const mobileCalendarRowsFiltered = useMemo(() => {
    if (!mobileFilterEmpleadoId) return mobileCalendarRows;
    return mobileCalendarRows.filter((row) => Number(row.asignacion.id_empleado) === Number(mobileFilterEmpleadoId));
  }, [mobileCalendarRows, mobileFilterEmpleadoId]);

  const selectedPendingTrabajo = useMemo(
    () => pendingJobs.find((item) => Number(item.id_trabajo) === Number(selectedPendingJobId)) || null,
    [pendingJobs, selectedPendingJobId],
  );

  const employeeAgenda = useMemo(() => {
    if (isAdmin) return [];

    const rows = [];
    trabajos.forEach((trabajo) => {
      const asignaciones = Array.isArray(trabajo.asignaciones) ? trabajo.asignaciones : [];
      asignaciones.forEach((asignacion) => {
        if (Number(asignacion.id_empleado) !== Number(user.id_usuario)) return;
        if (!asignacion.fecha_inicio) return;
        const start = new Date(asignacion.fecha_inicio);
        if (Number.isNaN(start.getTime())) return;
        if (dateKey(start) !== selectedDateKey) return;

        rows.push({
          trabajo,
          asignacion,
          start,
        });
      });
    });

    rows.sort((a, b) => a.start.getTime() - b.start.getTime());
    return rows;
  }, [isAdmin, trabajos, user.id_usuario, selectedDateKey]);

  const employeeAgendaFiltered = useMemo(() => {
    if (employeeAgendaFilter === 'todos') return employeeAgenda;
    return employeeAgenda.filter(({ trabajo }) => normalizeEstadoTrabajo(trabajo.estado) === employeeAgendaFilter);
  }, [employeeAgenda, employeeAgendaFilter]);

  const onEditCliente = (cliente) => {
    setEditClienteId(cliente.id_cliente);
    setClienteForm({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
    });
  };

  const resetClienteForm = () => {
    setEditClienteId(null);
    setClienteForm({ nombre: '', telefono: '', email: '', direccion: '' });
  };

  const onSubmitCliente = async (event) => {
    event.preventDefault();
    clearFeedback();

    try {
      if (editClienteId) {
        await apiRequest(`/api/clientes/${editClienteId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre: clienteForm.nombre.trim(),
            telefono: clienteForm.telefono.trim(),
            email: clienteForm.email.trim(),
            direccion: clienteForm.direccion.trim(),
          }),
        });
        const msg = 'Cliente actualizado correctamente.';
        showSuccess(msg);
        pushFormNotification('success', msg);
      } else {
        await apiRequest('/api/clientes', {
          method: 'POST',
          body: JSON.stringify({
            nombre: clienteForm.nombre.trim(),
            telefono: clienteForm.telefono.trim(),
            email: clienteForm.email.trim(),
            direccion: clienteForm.direccion.trim(),
          }),
        });
        const msg = 'Cliente creado correctamente.';
        showSuccess(msg);
        pushFormNotification('success', msg);
      }
      resetClienteForm();
      await loadModuleData('clientes', { force: true, showLoader: false });
    } catch (error) {
      const msg = error.message || 'No se pudo guardar el cliente.';
      showError(msg);
      pushFormNotification('error', msg);
    }
  };

  const onDeleteCliente = async (idCliente) => {
    clearFeedback();
    try {
      await apiRequest(`/api/clientes/${idCliente}`, { method: 'DELETE' });
      showSuccess('Cliente eliminado.');
      if (editClienteId === idCliente) resetClienteForm();
      await loadModuleData('clientes', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo eliminar el cliente.');
    }
  };

  const onMarkLeido = async (idMensaje) => {
    clearFeedback();
    try {
      await apiRequest(`/api/formularios/${idMensaje}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'LeÃ­do' }),
      });
      showSuccess('Mensaje marcado como leÃ­do.');
      await loadModuleData('bandeja', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el mensaje.');
    }
  };

  const onDeleteMensaje = async (idMensaje) => {
    clearFeedback();
    try {
      await apiRequest(`/api/formularios/${idMensaje}`, {
        method: 'DELETE',
      });
      showSuccess('Mensaje eliminado.');
      await loadModuleData('bandeja', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo eliminar el mensaje.');
    }
  };

  const onDragStartPending = (event, trabajo) => {
    const payload = {
      type: 'pending',
      id_trabajo: trabajo.id_trabajo,
    };
    event.dataTransfer.setData(JOB_DRAG_MIME, JSON.stringify({
      ...payload,
    }));
    event.dataTransfer.effectAllowed = 'move';
    dragPayloadRef.current = payload;
    setDraggingJobId(trabajo.id_trabajo);
  };

  const onSelectPendingTrabajo = (idTrabajo) => {
    setSelectedPendingJobId((prev) => Number(prev) === Number(idTrabajo) ? null : Number(idTrabajo));
  };

  const onClearSelectedPendingTrabajo = () => {
    setSelectedPendingJobId(null);
  };

  const onDragStartAssignment = (event, trabajo, asignacion) => {
    const payload = {
      type: 'assignment',
      id_trabajo: trabajo.id_trabajo,
      id_asignacion: asignacion.id_asignacion,
    };
    event.dataTransfer.setData(JOB_DRAG_MIME, JSON.stringify({
      ...payload,
    }));
    event.dataTransfer.effectAllowed = 'move';
    dragPayloadRef.current = payload;
    setDraggingJobId(trabajo.id_trabajo);
  };

  const onDragEnd = () => {
    dragPayloadRef.current = null;
    setDraggingJobId(null);
    setDragOverKey('');
    setDragOverRangeKeys([]);
  };

  const onDragOverCell = (event, idEmpleado, targetDate, hour, minute) => {
    const payload = getDragPayload(event) || dragPayloadRef.current;
    if (!payload) {
      setDragOverKey('');
      setDragOverRangeKeys([]);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetDateKey = dateKey(targetDate);
    setDragOverKey(`${idEmpleado}-${targetDateKey}-${hour}-${minute}`);

    const idTrabajo = Number(payload.id_trabajo || draggingJobId);
    const trabajo = trabajos.find((item) => Number(item.id_trabajo) === idTrabajo);
    if (!trabajo) {
      setDragOverRangeKeys([`${idEmpleado}-${targetDateKey}-${hour}-${minute}`]);
      return;
    }

    const slotSpan = Math.max(1, Math.ceil((trabajo.duracion_minutos || 60) / SLOT_MINUTES));
    const startIndex = SLOT_INDEX_BY_TIME[`${hour}-${minute}`];
    if (startIndex === undefined) {
      setDragOverRangeKeys([`${idEmpleado}-${targetDateKey}-${hour}-${minute}`]);
      return;
    }

    const rangeKeys = [];
    for (let i = 0; i < slotSpan; i += 1) {
      const slot = CALENDAR_SLOTS[startIndex + i];
      if (!slot) break;
      rangeKeys.push(`${idEmpleado}-${targetDateKey}-${slot.hour}-${slot.minute}`);
    }
    setDragOverRangeKeys(rangeKeys);
  };

  const assignJobToSlot = async (payload, idEmpleado, targetDate, hour, minute) => {
    if (isSavingSchedule) return;

    const idTrabajo = Number(payload?.id_trabajo);
    if (!idTrabajo) return;

    const trabajo = trabajos.find((item) => Number(item.id_trabajo) === idTrabajo);
    if (!trabajo) return;
    const previousTrabajos = trabajos;
    const empleadoAsignado = usuarios.find((item) => Number(item.id_usuario) === Number(idEmpleado)) || null;

    const start = normalizeDay(targetDate);
    start.setHours(hour, minute, 0, 0);
    const targetDateKey = dateKey(targetDate);

    if (trabajo.fecha_inicio && dateKey(trabajo.fecha_inicio) !== targetDateKey) {
      showError('Este trabajo solo puede asignarse en su fecha programada.');
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    if (
      (trabajo.dia_semana !== null && trabajo.dia_semana !== undefined && trabajo.dia_semana !== '')
      && Number(trabajo.dia_semana) !== new Date(targetDate).getDay()
    ) {
      showError('Este trabajo solo puede asignarse en su dia de la semana configurado.');
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    const durationMs = Math.max((trabajo.duracion_minutos || 60) * 60 * 1000, SLOT_MINUTES * 60 * 1000);

    const end = new Date(start.getTime() + durationMs);
    const asignaciones = Array.isArray(trabajo.asignaciones) ? trabajo.asignaciones : [];
    const requiredPeople = requiredPeopleOf(trabajo);

    const hasOverlappingAssignment = trabajos.some((item) => {
      const itemAsignaciones = Array.isArray(item.asignaciones) ? item.asignaciones : [];
      return itemAsignaciones.some((asig) => {
        if (Number(asig.id_empleado) !== Number(idEmpleado)) return false;
        if (payload.type === 'assignment' && Number(asig.id_asignacion) === Number(payload.id_asignacion)) return false;
        if (!asig.fecha_inicio) return false;

        const asigStart = new Date(asig.fecha_inicio);
        if (Number.isNaN(asigStart.getTime())) return false;

        const asigEnd = asig.fecha_fin
          ? new Date(asig.fecha_fin)
          : new Date(asigStart.getTime() + Math.max((item.duracion_minutos || 60) * 60 * 1000, SLOT_MINUTES * 60 * 1000));
        if (Number.isNaN(asigEnd.getTime()) || asigEnd.getTime() <= asigStart.getTime()) return false;

        return start.getTime() < asigEnd.getTime() && end.getTime() > asigStart.getTime();
      });
    });

    if (hasOverlappingAssignment) {
      showError('Ese empleado ya tiene otro servicio en ese horario.');
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    if (payload.type === 'pending' && asignaciones.length >= requiredPeople) {
      showError('Este trabajo ya tiene el numero de personas requerido.');
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    if (payload.type === 'pending' && asignaciones.some((a) => Number(a.id_empleado) === Number(idEmpleado))) {
      showError('Ese empleado ya esta asignado a este trabajo.');
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    setDragOverKey('');
    setDragOverRangeKeys([]);
    setDraggingJobId(null);
    clearFeedback();
    setIsSavingSchedule(true);
    const optimisticAssignment = payload.type === 'assignment'
      ? {
        id_asignacion: payload.id_asignacion,
        id_empleado: idEmpleado,
        fecha_inicio: start.toISOString(),
        fecha_fin: end.toISOString(),
        empleado: empleadoAsignado,
      }
      : {
        id_asignacion: `temp-${Date.now()}`,
        id_empleado: idEmpleado,
        fecha_inicio: start.toISOString(),
        fecha_fin: end.toISOString(),
        empleado: empleadoAsignado,
      };

    setTrabajos((prev) => prev.map((item) => {
      if (Number(item.id_trabajo) !== idTrabajo) return item;
      const current = Array.isArray(item.asignaciones) ? item.asignaciones : [];
      const nextAsignaciones = payload.type === 'assignment'
        ? current.map((asig) => Number(asig.id_asignacion) === Number(payload.id_asignacion) ? optimisticAssignment : asig)
        : [...current, optimisticAssignment];
      return {
        ...item,
        asignaciones: nextAsignaciones,
      };
    }));

    try {
      await apiRequest(`/api/trabajos/${idTrabajo}/agenda`, {
        method: 'PATCH',
        body: JSON.stringify({
          id_asignacion: payload.type === 'assignment' ? payload.id_asignacion : null,
          id_empleado: idEmpleado,
          fecha_inicio: start.toISOString(),
          fecha_fin: end.toISOString(),
        }),
      });
      setUndoAction(null);
      setSelectedPendingJobId(null);
      showSuccess('Servicio reasignado.');
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      setTrabajos(previousTrabajos);
      showError(error.message || 'No se pudo reasignar el servicio.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const onDropJob = async (event, idEmpleado, targetDate, hour, minute) => {
    const payload = getDragPayload(event) || dragPayloadRef.current;
    if (!payload) return;

    event.preventDefault();
    await assignJobToSlot(payload, idEmpleado, targetDate, hour, minute);
  };

  const onTapAssignToCell = async (idEmpleado, targetDate, hour, minute) => {
    if (!selectedPendingJobId) return;
    await assignJobToSlot({ type: 'pending', id_trabajo: selectedPendingJobId }, idEmpleado, targetDate, hour, minute);
  };

  const onAssignSelectedPendingMobile = async () => {
    if (!selectedPendingJobId) {
      showError('Selecciona primero un trabajo pendiente.');
      return;
    }
    if (!mobileAssignEmpleadoId) {
      showError('Selecciona un empleado para asignar.');
      return;
    }

    const [hourRaw, minuteRaw] = String(mobileAssignSlot || '08:00').split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      showError('Hora de inicio no valida.');
      return;
    }

    await assignJobToSlot(
      { type: 'pending', id_trabajo: selectedPendingJobId },
      Number(mobileAssignEmpleadoId),
      selectedDate,
      hour,
      minute,
    );
  };

  const onMoveMobileRowToPending = async (row) => {
    if (!row?.asignacion?.id_asignacion || !row?.trabajo?.id_trabajo) return;
    await moveAssignmentToPending({
      type: 'assignment',
      id_trabajo: row.trabajo.id_trabajo,
      id_asignacion: row.asignacion.id_asignacion,
    });
  };

  const onStartMobileEditAssignment = (row) => {
    const start = row?.start ? new Date(row.start) : null;
    setMobileEditingAsignacionId(row?.asignacion?.id_asignacion || null);
    setMobileEditEmpleadoId(String(row?.asignacion?.id_empleado || ''));
    if (start && !Number.isNaN(start.getTime())) {
      setMobileEditSlot(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
    } else {
      setMobileEditSlot('08:00');
    }
  };

  const onCancelMobileEditAssignment = () => {
    setMobileEditingAsignacionId(null);
    setMobileEditEmpleadoId('');
    setMobileEditSlot('08:00');
  };

  const onSaveMobileEditAssignment = async (row) => {
    if (!row?.asignacion?.id_asignacion || !row?.trabajo?.id_trabajo) return;
    if (!mobileEditEmpleadoId) {
      showError('Selecciona un empleado para guardar el cambio.');
      return;
    }

    const [hourRaw, minuteRaw] = String(mobileEditSlot || '08:00').split(':');
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      showError('Hora de inicio no valida.');
      return;
    }

    await assignJobToSlot(
      {
        type: 'assignment',
        id_trabajo: row.trabajo.id_trabajo,
        id_asignacion: row.asignacion.id_asignacion,
      },
      Number(mobileEditEmpleadoId),
      selectedDate,
      hour,
      minute,
    );
    onCancelMobileEditAssignment();
  };

  const onDragOverPending = (event) => {
    const payload = getDragPayload(event) || dragPayloadRef.current;
    if (!payload) {
      setDragOverKey('');
      setDragOverRangeKeys([]);
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverKey('pending-bin');
    setDragOverRangeKeys([]);
  };

  const moveAssignmentToPending = async (payload) => {
    if (isSavingSchedule) return;

    const idTrabajo = Number(payload?.id_trabajo);
    if (!idTrabajo) return;
    if (payload?.type !== 'assignment') {
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    const trabajo = trabajos.find((item) => Number(item.id_trabajo) === idTrabajo);
    if (!trabajo) return;
    const currentAsig = (trabajo.asignaciones || []).find((asig) => Number(asig.id_asignacion) === Number(payload.id_asignacion));
    if (!currentAsig) {
      setDragOverKey('');
      setDragOverRangeKeys([]);
      setDraggingJobId(null);
      return;
    }

    const previousTrabajos = trabajos;
    const previousSnapshot = {
      id_asignacion: currentAsig.id_asignacion,
      id_empleado: currentAsig.id_empleado ?? null,
      fecha_inicio: currentAsig.fecha_inicio ?? null,
      fecha_fin: currentAsig.fecha_fin ?? null,
      empleado: currentAsig.empleado ?? null,
      id_trabajo: trabajo.id_trabajo,
    };
    setDragOverKey('');
    setDragOverRangeKeys([]);
    setDraggingJobId(null);
    clearFeedback();
    setIsSavingSchedule(true);

    setTrabajos((prev) => prev.map((item) => {
      if (Number(item.id_trabajo) !== idTrabajo) return item;
      return {
        ...item,
        asignaciones: (item.asignaciones || []).filter((asig) => Number(asig.id_asignacion) !== Number(payload.id_asignacion)),
      };
    }));

    try {
      await apiRequest(`/api/trabajos/${idTrabajo}/agenda`, {
        method: 'PATCH',
        body: JSON.stringify({
          id_asignacion: payload.id_asignacion,
          id_empleado: null,
          fecha_inicio: null,
          fecha_fin: null,
        }),
      });
      setUndoAction({ idTrabajo, previousSnapshot });
      setSelectedPendingJobId(null);
      showSuccess('Servicio devuelto a pendientes.');
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      setTrabajos(previousTrabajos);
      showError(error.message || 'No se pudo devolver el servicio a pendientes.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const onDropToPending = async (event) => {
    const payload = getDragPayload(event) || dragPayloadRef.current;
    if (!payload) return;

    event.preventDefault();
    await moveAssignmentToPending(payload);
  };

  const onUndoPending = async () => {
    if (!undoAction || isSavingSchedule) return;

    const { idTrabajo, previousSnapshot } = undoAction;
    const previousTrabajos = trabajos;
    clearFeedback();
    setIsSavingSchedule(true);
    setUndoAction(null);

    setTrabajos((prev) => prev.map((item) => {
      if (Number(item.id_trabajo) !== Number(idTrabajo)) return item;
      const withoutSame = (item.asignaciones || []).filter((asig) => Number(asig.id_asignacion) !== Number(previousSnapshot.id_asignacion));
      return {
        ...item,
        asignaciones: [
          ...withoutSame,
          {
            id_asignacion: previousSnapshot.id_asignacion,
            id_empleado: previousSnapshot.id_empleado,
            fecha_inicio: previousSnapshot.fecha_inicio,
            fecha_fin: previousSnapshot.fecha_fin,
            empleado: previousSnapshot.empleado,
          },
        ],
      };
    }));

    try {
      await apiRequest(`/api/trabajos/${idTrabajo}/agenda`, {
        method: 'PATCH',
        body: JSON.stringify({
          id_asignacion: previousSnapshot.id_asignacion,
          id_empleado: previousSnapshot.id_empleado,
          fecha_inicio: previousSnapshot.fecha_inicio,
          fecha_fin: previousSnapshot.fecha_fin,
        }),
      });
      showSuccess('Cambio deshecho.');
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      setTrabajos(previousTrabajos);
      showError(error.message || 'No se pudo deshacer el cambio.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const onIniciarJornada = async () => {
    if (isSavingJornada) return;
    clearFeedback();
    setIsSavingJornada(true);
    try {
      await apiRequest('/api/jornada/iniciar', {
        method: 'POST',
        body: JSON.stringify({ empleado_id: user.id_usuario }),
      });
      showSuccess('Jornada iniciada.');
      await loadModuleData('mi-agenda', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo iniciar la jornada.');
    } finally {
      setIsSavingJornada(false);
    }
  };

  const onFinalizarJornada = async () => {
    if (isSavingJornada) return;
    clearFeedback();
    setIsSavingJornada(true);
    try {
      await apiRequest('/api/jornada/finalizar', {
        method: 'POST',
        body: JSON.stringify({ empleado_id: user.id_usuario }),
      });
      showSuccess('Jornada finalizada.');
      await loadModuleData('mi-agenda', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo finalizar la jornada.');
    } finally {
      setIsSavingJornada(false);
    }
  };

  const onTrabajoAction = async (idTrabajo, action, payload = {}) => {
    if (!idTrabajo || isUpdatingTrabajo) return;
    clearFeedback();
    setIsUpdatingTrabajo(true);
    setCompletingTrabajoId(idTrabajo);

    try {
      await apiRequest(`/api/trabajos/${idTrabajo}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ empleado_id: user.id_usuario, ...payload }),
      });

      const labels = {
        iniciar: 'Trabajo iniciado.',
        pausar: 'Trabajo pausado.',
        reanudar: 'Trabajo reanudado.',
        finalizar: 'Trabajo finalizado.',
      };
      showSuccess(labels[action] || 'Trabajo actualizado.');
      setFinalizeModal({
        open: false,
        trabajo: null,
        tiempoEstimado: 0,
        tiempoRealEfectivo: 0,
        notas: '',
      });
      await loadModuleData('mi-agenda', { force: true, showLoader: false });
      if (isAdmin) {
        await loadModuleData('rentabilidad', { force: true, showLoader: false });
      }
    } catch (error) {
      if (action === 'finalizar' && error.message && error.message.includes('justificar')) {
        const trabajo = trabajos.find((item) => Number(item.id_trabajo) === Number(idTrabajo));
        setFinalizeModal({
          open: true,
          trabajo,
          tiempoEstimado: Number(trabajo?.tiempo_estimado || trabajo?.duracion_minutos || 0),
          tiempoRealEfectivo: Number(trabajo?.tiempo_real_efectivo || 0),
          notas: '',
        });
      } else {
        showError(error.message || 'No se pudo actualizar el trabajo.');
      }
    } finally {
      setIsUpdatingTrabajo(false);
      setCompletingTrabajoId(null);
    }
  };

  const onFinalizarTrabajo = async (trabajo, notes = '') => {
    if (!trabajo) return;
    await onTrabajoAction(trabajo.id_trabajo, 'finalizar', { notas_empleado: notes || undefined });
  };

  const auditoriaPrincipalRows = useMemo(() => {
    const jornadaRows = auditoriaJornadas.map((row) => {
      const empleadoNombre = `${row.empleado?.nombre || ''} ${row.empleado?.apellidos || ''}`.trim() || row.empleado?.username || `Empleado #${row.empleado_id}`;
      return {
        id: `jornada-${row.id_registro_jornada}`,
        fecha: row.hora_fin || row.hora_inicio || row.fecha || '',
        tipo: 'Jornada',
        referencia: empleadoNombre,
        responsable: empleadoNombre,
        detalle: `Inicio ${formatDateTime(row.hora_inicio)} | Fin ${formatDateTime(row.hora_fin)} | Auditado ${row.modificado_por_admin ? 'Si' : 'No'}`,
        motivo: row.motivo_modificacion_admin || '-',
      };
    });

    const ajusteRows = auditoriaAjustesTrabajos.map((row) => {
      const adminNombre = `${row.admin?.nombre || ''} ${row.admin?.apellidos || ''}`.trim() || row.admin?.username || `Admin #${row.id_admin}`;
      const trabajoTitulo = row.trabajo?.descripcion_tarea || `Trabajo #${row.id_trabajo}`;
      return {
        id: `ajuste-${row.id_registro_auditoria_trabajo}`,
        fecha: row.fecha_registro || '',
        tipo: 'Ajuste trabajo',
        referencia: trabajoTitulo,
        responsable: adminNombre,
        detalle: `Estimado ${formatMinutes(row.tiempo_estimado_anterior)} -> ${formatMinutes(row.tiempo_estimado_nuevo)} | Real ${formatMinutes(row.tiempo_real_anterior)} -> ${formatMinutes(row.tiempo_real_nuevo)}`,
        motivo: row.motivo_ajuste || '-',
      };
    });

    return [...jornadaRows, ...ajusteRows].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [auditoriaJornadas, auditoriaAjustesTrabajos]);

  const onExportAuditoriaCsv = () => {
    const header = ['Fecha', 'Tipo', 'Referencia', 'Responsable', 'Detalle', 'Motivo'];
    const rows = auditoriaPrincipalRows.map((row) => [
      formatDateTime(row.fecha),
      row.tipo,
      row.referencia,
      row.responsable,
      row.detalle,
      String(row.motivo || '-').replace(/\r?\n/g, ' '),
    ]);
    const csv = [header, ...rows]
      .map((cols) => cols.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-jornadas-${dateKey(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const trabajosRealizados = useMemo(() => {
    return trabajos
      .filter((trabajo) => normalizeEstadoTrabajo(trabajo.estado) === 'finalizado')
      .sort((a, b) => {
        const aEnd = a.fin_operativo || a.fecha_fin || a.fecha_inicio || '';
        const bEnd = b.fin_operativo || b.fecha_fin || b.fecha_inicio || '';
        return new Date(bEnd).getTime() - new Date(aEnd).getTime();
      });
  }, [trabajos]);

  const onOpenEditRetraso = (trabajo) => {
    const empleadoNombre = `${trabajo.empleado?.nombre || ''} ${trabajo.empleado?.apellidos || ''}`.trim() || trabajo.empleado?.username || 'Sin empleado';
    setEditRetrasoModal({
      open: true,
      id: trabajo.id_trabajo,
      cliente: trabajo.cliente?.nombre || 'Cliente',
      empleado: empleadoNombre,
      tiempo_estimado: toNumeric(trabajo.tiempo_estimado || trabajo.duracion_minutos, 0),
      tiempo_real_efectivo: toNumeric(trabajo.tiempo_real_efectivo, 0),
      notas_empleado: trabajo.notas_empleado || '',
      motivo_ajuste: '',
    });
  };

  const onCloseEditRetraso = () => {
    if (isSavingRetrasoEdit) return;
    setEditRetrasoModal({
      open: false,
      id: null,
      cliente: '',
      empleado: '',
      tiempo_estimado: 0,
      tiempo_real_efectivo: 0,
      notas_empleado: '',
      motivo_ajuste: '',
    });
  };

  const onSaveEditRetraso = async () => {
    if (!editRetrasoModal.id || isSavingRetrasoEdit) return;
    if (!editRetrasoModal.motivo_ajuste.trim()) {
      showError('Debes indicar el motivo del ajuste.');
      return;
    }

    const tiempoEstimado = toNumeric(editRetrasoModal.tiempo_estimado, 0);
    const tiempoReal = toNumeric(editRetrasoModal.tiempo_real_efectivo, 0);
    if (tiempoEstimado <= 0 || tiempoReal <= 0) {
      showError('Los tiempos estimado y real deben ser mayores que 0.');
      return;
    }

    clearFeedback();
    setIsSavingRetrasoEdit(true);

    try {
      await apiRequest(`/api/trabajos/${editRetrasoModal.id}/retraso`, {
        method: 'PATCH',
        body: JSON.stringify({
          tiempo_estimado: tiempoEstimado,
          tiempo_real_efectivo: tiempoReal,
          notas_empleado: editRetrasoModal.notas_empleado.trim(),
          motivo_ajuste: editRetrasoModal.motivo_ajuste.trim(),
        }),
      });
      showSuccess('Trabajo ajustado correctamente.');
      onCloseEditRetraso();
      await loadModuleData('calendario', { force: true, showLoader: false });
      await loadModuleData('auditoria-legal', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo ajustar el trabajo.');
    } finally {
      setIsSavingRetrasoEdit(false);
    }
  };

  const onApplyDateRangeFilter = async () => {
    if (rangeMode === 'custom') {
      if (!customRangeFrom || !customRangeTo) {
        showError('Selecciona fecha desde y hasta para el rango personalizado.');
        return;
      }
      if (customRangeFrom > customRangeTo) {
        showError('La fecha desde no puede ser mayor que la fecha hasta.');
        return;
      }
    }

    clearFeedback();
    if (activeModule === 'auditoria-legal') {
      await loadModuleData('auditoria-legal', { force: true, showLoader: false });
    }
    if (activeModule === 'rentabilidad') {
      await loadModuleData('rentabilidad', { force: true, showLoader: false });
    }
  };

  const renderDateRangeFilter = () => {
    return (
      <div className="bi-filter-bar">
        <label className="bi-filter-field">
          <span>Rango</span>
          <select value={rangeMode} onChange={(event) => setRangeMode(event.target.value)}>
            <option value="dias">Dias</option>
            <option value="meses">Meses</option>
            <option value="anios">AÃ±os</option>
            <option value="custom">Personalizado</option>
          </select>
        </label>

        {rangeMode !== 'custom' ? (
          <label className="bi-filter-field bi-filter-small">
            <span>Cantidad</span>
            <input
              type="number"
              min="1"
              max={rangeMode === 'dias' ? '365' : '36'}
              value={rangeAmount}
              onChange={(event) => setRangeAmount(event.target.value)}
            />
          </label>
        ) : (
          <>
            <label className="bi-filter-field">
              <span>Desde</span>
              <input type="date" value={customRangeFrom} onChange={(event) => setCustomRangeFrom(event.target.value)} />
            </label>
            <label className="bi-filter-field">
              <span>Hasta</span>
              <input type="date" value={customRangeTo} onChange={(event) => setCustomRangeTo(event.target.value)} />
            </label>
          </>
        )}

        <button type="button" className="action-btn" onClick={onApplyDateRangeFilter}>Aplicar filtro</button>
      </div>
    );
  };

  const onProfileAvatarSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      showError('La imagen debe ser JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      showError('La imagen supera 2MB. Elige una mas ligera.');
      event.target.value = '';
      return;
    }

    setProfileAvatarFile(file);
    setRemoveProfileAvatar(false);
    setErrorMessage('');
  };

  const onRemoveProfileAvatar = () => {
    setProfileAvatarFile(null);
    setProfileAvatarPreview('');
    setRemoveProfileAvatar(true);
  };

  const onSubmitProfile = async (event) => {
    event.preventDefault();
    clearFeedback();
    setIsSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append('nombre', (profileForm.nombre || '').trim());
      formData.append('apellidos', (profileForm.apellidos || '').trim());
      formData.append('username', (profileForm.username || '').trim());
      if (profileForm.password) {
        formData.append('password', profileForm.password);
      }
      if (profileAvatarFile) {
        formData.append('avatar', profileAvatarFile);
      }
      if (removeProfileAvatar) {
        formData.append('remove_avatar', '1');
      }

      const token = localStorage.getItem('ezlo_token');

      const response = await fetch(buildApiUrl(`/api/usuarios/${user.id_usuario}/perfil`), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('La imagen supera el limite permitido por el servidor. Usa menos de 2MB.');
        }

        const validationErrors = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : '';
        throw new Error(validationErrors || data?.message || 'No se pudo guardar el perfil.');
      }

      setProfileForm((prev) => ({
        ...prev,
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        username: data.username || '',
        password: '',
      }));
      setProfileAvatarFile(null);
      setProfileAvatarPreview('');
      setRemoveProfileAvatar(false);

      updateStoredUser({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        username: data.username || '',
        avatar_url: data.avatar_url || null,
      });

      showSuccess('Perfil actualizado correctamente.');
    } catch (error) {
      showError(error.message || 'No se pudo actualizar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onCreateTrabajo = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!trabajoForm.id_cliente) {
      const msg = 'Selecciona un cliente para crear el trabajo.';
      showError(msg);
      pushFormNotification('error', msg);
      return;
    }

    const duration = Number(trabajoForm.duracion_minutos || 60);
    if (!duration || duration < 15 || duration % 15 !== 0) {
      const msg = 'La duracion debe ser multiplo de 15 minutos.';
      showError(msg);
      pushFormNotification('error', msg);
      return;
    }

    if (!trabajoForm.personas_requeridas) {
      setNeedsPeopleReminder(true);
    } else {
      setNeedsPeopleReminder(false);
    }

    try {
      await apiRequest('/api/trabajos', {
        method: 'POST',
        body: JSON.stringify({
          id_cliente: Number(trabajoForm.id_cliente),
          descripcion_tarea: trabajoForm.descripcion_tarea.trim(),
          duracion_minutos: duration,
          personas_requeridas: trabajoForm.personas_requeridas ? Number(trabajoForm.personas_requeridas) : null,
          ubicacion: trabajoForm.ubicacion.trim() || null,
          observaciones: trabajoForm.observaciones.trim() || null,
          estado: 'pendiente',
        }),
      });
      setTrabajoForm({
        id_cliente: '',
        descripcion_tarea: '',
        duracion_minutos: '60',
        personas_requeridas: '',
        ubicacion: '',
        observaciones: '',
      });
      const msg = 'Trabajo creado y enviado a pendientes.';
      showSuccess(msg);
      pushFormNotification('success', msg);
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      const msg = error.message || 'No se pudo crear el trabajo.';
      showError(msg);
      pushFormNotification('error', msg);
    }
  };

  const onCreatePlantillaTrabajo = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!plantillaForm.id_cliente) {
      const msg = 'Selecciona un cliente para guardar la plantilla.';
      showError(msg);
      pushFormNotification('error', msg);
      return;
    }

    const duration = Number(plantillaForm.duracion_minutos || 60);
    if (!duration || duration < 15 || duration % 15 !== 0) {
      const msg = 'La duracion de plantilla debe ser multiplo de 15 minutos.';
      showError(msg);
      pushFormNotification('error', msg);
      return;
    }

    try {
      await apiRequest('/api/trabajos-plantillas', {
        method: 'POST',
        body: JSON.stringify({
          nombre: plantillaForm.nombre.trim(),
          id_cliente: Number(plantillaForm.id_cliente),
          descripcion_tarea: plantillaForm.descripcion_tarea.trim(),
          duracion_minutos: duration,
          personas_requeridas: plantillaForm.personas_requeridas ? Number(plantillaForm.personas_requeridas) : null,
          dia_semana: plantillaForm.dia_semana !== '' ? Number(plantillaForm.dia_semana) : null,
          ubicacion: plantillaForm.ubicacion.trim() || null,
          observaciones: plantillaForm.observaciones.trim() || null,
          activa: true,
        }),
      });

      setPlantillaForm({
        nombre: '',
        id_cliente: '',
        descripcion_tarea: '',
        duracion_minutos: '60',
        personas_requeridas: '',
        dia_semana: '',
        ubicacion: '',
        observaciones: '',
      });
      const msg = 'Plantilla guardada correctamente.';
      showSuccess(msg);
      pushFormNotification('success', msg);
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      const msg = error.message || 'No se pudo guardar la plantilla.';
      showError(msg);
      pushFormNotification('error', msg);
    }
  };

  const onProgramarDesdePlantilla = async (idPlantilla) => {
    clearFeedback();

    const dias = Number(programarDiasConsecutivos || 1);
    if (!dias || dias < 1 || dias > 30) {
      showError('El numero de dias debe estar entre 1 y 30.');
      return;
    }

    try {
      await apiRequest('/api/trabajos/desde-plantilla', {
        method: 'POST',
        body: JSON.stringify({
          id_plantilla: Number(idPlantilla),
          fecha_base: programarFechaBase || null,
          hora_inicio: programarFechaBase ? programarHoraInicio : null,
          dias_consecutivos: dias,
        }),
      });

      showSuccess(`Trabajo(s) generado(s) desde plantilla para ${dias} dia(s).`);
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo generar trabajos desde plantilla.');
    }
  };

  const onDeletePlantilla = async (idPlantilla) => {
    clearFeedback();
    try {
      await apiRequest(`/api/trabajos-plantillas/${idPlantilla}`, { method: 'DELETE' });
      showSuccess('Plantilla eliminada.');
      await loadModuleData('calendario', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo eliminar la plantilla.');
    }
  };

  const onEditEmpleado = (empleado) => {
    setEditEmployeeId(empleado.id_usuario);
    setEmployeeForm({
      nombre: empleado.nombre || '',
      apellidos: empleado.apellidos || '',
      username: empleado.username || '',
      password: '',
      rol: empleado.rol || 'Empleado',
    });
  };

  const resetEmployeeForm = () => {
    setEditEmployeeId(null);
    setEmployeeForm({
      nombre: '',
      apellidos: '',
      username: '',
      password: '',
      rol: 'Empleado',
    });
  };

  const onDeleteEmpleado = async (idUsuario) => {
    clearFeedback();
    try {
      await apiRequest(`/api/usuarios/${idUsuario}`, { method: 'DELETE' });
      if (Number(editEmployeeId) === Number(idUsuario)) {
        resetEmployeeForm();
      }
      showSuccess('Usuario eliminado correctamente.');
      await loadModuleData('empleados', { force: true, showLoader: false });
    } catch (error) {
      showError(error.message || 'No se pudo eliminar el usuario.');
    }
  };

  const onSubmitEmpleado = async (event) => {
    event.preventDefault();
    clearFeedback();

    try {
      const payload = {
        nombre: employeeForm.nombre.trim(),
        apellidos: employeeForm.apellidos.trim(),
        username: employeeForm.username.trim(),
        rol: employeeForm.rol,
      };

      if (employeeForm.password) {
        payload.password = employeeForm.password;
      }

      if (editEmployeeId) {
        await apiRequest(`/api/usuarios/${editEmployeeId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        const msg = 'Usuario actualizado correctamente.';
        showSuccess(msg);
        pushFormNotification('success', msg);
      } else {
        if (!employeeForm.password || employeeForm.password.length < 6) {
          const msg = 'La contrasena debe tener al menos 6 caracteres.';
          showError(msg);
          pushFormNotification('error', msg);
          return;
        }

        await apiRequest('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            password: employeeForm.password,
          }),
        });
        const msg = 'Usuario creado correctamente.';
        showSuccess(msg);
        pushFormNotification('success', msg);
      }

      resetEmployeeForm();
      await loadModuleData('empleados', { force: true, showLoader: false });
    } catch (error) {
      const msg = error.message || 'No se pudo guardar el usuario.';
      showError(msg);
      pushFormNotification('error', msg);
    }
  };

  const renderClientesModule = () => {
    return (
      <section className="module-layout">
        <article className="module-card">
          <header className="module-header">
            <h2>Clientes</h2>
            <p>Manipula la base de datos de clientes: altas, cambios y bajas.</p>
          </header>

          <div className="records-list">
            {clientes.length === 0 && (
              <p className="empty-plain-note">No hay clientes, anade uno para empezar.</p>
            )}
            {filteredClientes.map((cliente) => (
              <div key={cliente.id_cliente} className="record-item">
                <div className="record-main">
                  <p className="record-title">{cliente.nombre}</p>
                  <p className="record-subtitle">{cliente.email || '-'} Â· {cliente.telefono || '-'}</p>
                  <p className="record-subtitle">{cliente.direccion || '-'}</p>
                </div>
                <div className="record-actions">
                  <button type="button" className="action-btn" onClick={() => onEditCliente(cliente)}>Editar</button>
                  <button type="button" className="action-btn danger" onClick={() => onDeleteCliente(cliente.id_cliente)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="module-card">
          <header className="module-header compact">
            <h3>{editClienteId ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          </header>

          <form className="stack-form" onSubmit={onSubmitCliente}>
            <input
              type="text"
              placeholder="Nombre"
              value={clienteForm.nombre}
              onChange={(event) => setClienteForm((prev) => ({ ...prev, nombre: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Telefono"
              value={clienteForm.telefono}
              onChange={(event) => setClienteForm((prev) => ({ ...prev, telefono: event.target.value }))}
            />
            <input
              type="email"
              placeholder="Email"
              value={clienteForm.email}
              onChange={(event) => setClienteForm((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              type="text"
              placeholder="Direccion"
              value={clienteForm.direccion}
              onChange={(event) => setClienteForm((prev) => ({ ...prev, direccion: event.target.value }))}
            />

            <div className="form-actions">
              <button type="submit" className="solid-btn">{editClienteId ? 'Guardar cambios' : 'Crear cliente'}</button>
              {editClienteId && (
                <button type="button" className="ghost-btn" onClick={resetClienteForm}>Cancelar</button>
              )}
            </div>
          </form>
        </article>
      </section>
    );
  };

  const renderBandejaModule = () => {
    return (
      <section className="module-layout single">
        <article className="module-card module-page bandeja-page">
          <header className="module-header bandeja-header">
            <h2>Bandeja</h2>
            <p>Revisa formularios entrantes desde la web publica.</p>
          </header>

          <div className="inbox-list bandeja-list">
            {filteredMensajes.length === 0 && (
              <p className="empty-hint">No hay mensajes en la bandeja.</p>
            )}

            {filteredMensajes.map((mensaje) => {
              const parsed = parseInboxMessage(mensaje.cuerpo_mensaje);
              return (
                <article key={mensaje.id_mensaje} className="inbox-item">
                  <div className="inbox-head">
                    <div className="inbox-main">
                      <p className="record-title">{mensaje.remitente_nombre}</p>
                      <p className="record-subtitle">{mensaje.remitente_email}</p>
                    </div>
                    <div className="inbox-badges">
                      <span className={`status-chip ${mensaje.estado === 'LeÃ­do' ? 'ok' : 'pending'}`}>{mensaje.estado}</span>
                      <span className="inbox-meta-chip">{formatDate(mensaje.fecha_recepcion)}</span>
                    </div>
                  </div>

                  <div className="inbox-fields">
                    <div className="inbox-field">
                      <span className="inbox-field-label">Tipo</span>
                      <span className="inbox-field-value">{parsed.tipo || 'No indicado'}</span>
                    </div>
                    <div className="inbox-field">
                      <span className="inbox-field-label">Telefono</span>
                      <span className="inbox-field-value">{parsed.telefono || 'No indicado'}</span>
                    </div>
                  </div>

                  <div className="inbox-message-block">
                    <p className="inbox-message-title">Mensaje</p>
                    <p className="record-message inbox-message-body">{parsed.mensaje || '-'}</p>
                  </div>

                  <div className="inbox-actions">
                    {mensaje.estado !== 'LeÃ­do' && (
                      <button type="button" className="action-btn" onClick={() => onMarkLeido(mensaje.id_mensaje)}>
                        Marcar leÃ­do
                      </button>
                    )}
                    <button type="button" className="action-btn danger" onClick={() => onDeleteMensaje(mensaje.id_mensaje)}>
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </article>
      </section>
    );
  };

  const renderTrabajosModule = () => {
    return (
      <section className="module-layout single">
        <article className="module-card module-page trabajos-page">
          <header className="module-header trabajos-header">
            <h2>Plantillas de trabajo</h2>
            <p>Guarda servicios tipo y generalos para X dias. La fecha es opcional: si no la pones, se crean pendientes para colocar cualquier dia.</p>
          </header>

          <div className="trabajos-content">
            <section className="trabajos-surface">
              <h3 className="trabajos-section-title">Crear plantilla</h3>
              <form className="pending-create-form trabajos-form" onSubmit={onCreatePlantillaTrabajo}>
                <div className="trabajos-form-grid">
                  <input
                    type="text"
                    placeholder="Nombre plantilla"
                    value={plantillaForm.nombre}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, nombre: event.target.value }))}
                    required
                  />
                  <select
                    value={plantillaForm.id_cliente}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, id_cliente: event.target.value }))}
                    required
                  >
                    <option value="">Cliente...</option>
                    {clientes.map((cliente) => (
                      <option key={`tpl-cliente-${cliente.id_cliente}`} value={cliente.id_cliente}>{cliente.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Descripcion base"
                    value={plantillaForm.descripcion_tarea}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, descripcion_tarea: event.target.value }))}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Ubicacion"
                    value={plantillaForm.ubicacion}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Observaciones"
                    value={plantillaForm.observaciones}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                  />
                  <select
                    value={plantillaForm.dia_semana}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, dia_semana: event.target.value }))}
                  >
                    <option value="">Dia de la semana (opcional)</option>
                    {WEEKDAY_OPTIONS.map((weekday) => (
                      <option key={`weekday-${weekday.value}`} value={weekday.value}>{weekday.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pending-create-row trabajos-mini-row">
                  <input
                    type="number"
                    min="15"
                    step="15"
                    placeholder="Duracion (min)"
                    value={plantillaForm.duracion_minutos}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, duracion_minutos: event.target.value }))}
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="N personas"
                    value={plantillaForm.personas_requeridas}
                    onChange={(event) => setPlantillaForm((prev) => ({ ...prev, personas_requeridas: event.target.value }))}
                  />
                </div>

                <p className="trabajos-form-label">Programar y generar</p>
                <div className="pending-create-row template-schedule-row trabajos-schedule-row">
                  <input
                    type="date"
                    aria-label="Fecha base"
                    value={programarFechaBase}
                    onChange={(event) => setProgramarFechaBase(event.target.value)}
                  />
                  <input
                    type="time"
                    aria-label="Hora de inicio"
                    value={programarHoraInicio}
                    onChange={(event) => setProgramarHoraInicio(event.target.value)}
                  />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    inputMode="numeric"
                    value={programarDiasConsecutivos}
                    onChange={(event) => setProgramarDiasConsecutivos(event.target.value)}
                    placeholder="Dias consecutivos"
                  />
                </div>

                <button type="submit" className="solid-btn">Guardar plantilla</button>
              </form>
            </section>

            <section className="trabajos-surface trabajos-surface-list">
              <h3 className="trabajos-section-title trabajos-list-title">Plantillas guardadas</h3>
              <div className="template-list trabajos-template-list">
                {plantillasTrabajo.length === 0 && (
                  <p className="empty-hint">No hay plantillas guardadas.</p>
                )}
                {plantillasTrabajo.map((plantilla) => (
                  <div key={plantilla.id_plantilla} className="template-item">
                    <div>
                      <p className="drag-job-title">{plantilla.nombre}</p>
                      <p className="drag-job-meta">{plantilla.cliente?.nombre || 'Cliente'} Â· {plantilla.duracion_minutos || 60} min Â· {plantilla.personas_requeridas || 1} pers</p>
                      {plantilla.dia_semana !== null && plantilla.dia_semana !== undefined && (
                        <p className="drag-job-meta">Dia: {weekdayLabelFromNumber(plantilla.dia_semana)}</p>
                      )}
                      {plantilla.ubicacion && <p className="drag-job-meta">{plantilla.ubicacion}</p>}
                    </div>
                    <div className="template-actions">
                      <button type="button" className="action-btn" onClick={() => onProgramarDesdePlantilla(plantilla.id_plantilla)}>
                        Generar
                      </button>
                      <button type="button" className="action-btn danger" onClick={() => onDeletePlantilla(plantilla.id_plantilla)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </article>
      </section>
    );
  };

  const renderCalendarioModule = () => {
    if (empleados.length === 0) {
      return (
        <section className="module-layout single">
          <article className="module-card">
            <div className="empty-state">
              <p className="empty-state-msg">Â¡AÃ±ade un empleado para empezar!</p>
              <p className="empty-state-sub">Ve al apartado <strong>Empleados</strong> y crea el primer usuario del equipo.</p>
            </div>
          </article>
        </section>
      );
    }

    return (
      <section className="module-layout single">
        <article className="module-card module-page calendar-page">
          <div className="calendar-day-nav">
            <button
              type="button"
              className="day-nav-btn"
              onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
            >
              Dia anterior
            </button>

            <div className="day-nav-center">
              <p className="calendar-day-title">{fullDateLabel(selectedDate)}</p>
              <div className="day-strip" role="tablist" aria-label="Navegacion de dias">
                {dayStrip.map((day) => {
                  const chipKey = dateKey(day);
                  const isActive = chipKey === selectedDateKey;
                  return (
                    <button
                      key={chipKey}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`day-chip${isActive ? ' active' : ''}`}
                      onClick={() => setSelectedDate(normalizeDay(day))}
                    >
                      {dayChipLabel(day)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="day-actions">
              <button
                type="button"
                className="day-nav-btn"
                onClick={() => setSelectedDate(normalizeDay(new Date()))}
              >
                Hoy
              </button>
              <button
                type="button"
                className="day-nav-btn"
                onClick={() => setSelectedDate((prev) => normalizeDay(addDays(prev, 1)))}
              >
                Dia siguiente
              </button>
            </div>
          </div>

          <div className="calendar-board">
            <aside
              className={`calendar-pending${dragOverKey === 'pending-bin' ? ' is-over' : ''}`}
              onDragOver={onDragOverPending}
              onDragLeave={() => setDragOverKey('')}
              onDrop={onDropToPending}
            >
              <h3>Nuevo trabajo puntual</h3>
              <p className="pending-help">Crea aqui trabajos puntuales para este flujo de planificacion diaria.</p>
              <form className="pending-create-form" onSubmit={onCreateTrabajo}>
                <select
                  value={trabajoForm.id_cliente}
                  onChange={(event) => setTrabajoForm((prev) => ({ ...prev, id_cliente: event.target.value }))}
                  required
                >
                  <option value="">Cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={`job-cal-${cliente.id_cliente}`} value={cliente.id_cliente}>{cliente.nombre}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Descripcion del trabajo"
                  value={trabajoForm.descripcion_tarea}
                  onChange={(event) => setTrabajoForm((prev) => ({ ...prev, descripcion_tarea: event.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Ubicacion / direccion"
                  value={trabajoForm.ubicacion}
                  onChange={(event) => setTrabajoForm((prev) => ({ ...prev, ubicacion: event.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Observaciones"
                  value={trabajoForm.observaciones}
                  onChange={(event) => setTrabajoForm((prev) => ({ ...prev, observaciones: event.target.value }))}
                />
                <div className="pending-create-row">
                  <input
                    type="number"
                    min="15"
                    step="15"
                    placeholder="Duracion (min)"
                    value={trabajoForm.duracion_minutos}
                    onChange={(event) => setTrabajoForm((prev) => ({ ...prev, duracion_minutos: event.target.value }))}
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="N personas"
                    value={trabajoForm.personas_requeridas}
                    onChange={(event) => setTrabajoForm((prev) => ({ ...prev, personas_requeridas: event.target.value }))}
                  />
                </div>
                {needsPeopleReminder && (
                  <p className="pending-reminder">Reminder: si no indicas personas, se asumira 1.</p>
                )}
                <button type="submit" className="solid-btn">Crear trabajo</button>
              </form>
              <br></br>
              <h3>Pendientes para asignar</h3>
              <p className="pending-help">En Ordenador: arrastra y suelta. En MÃ³vil: selecciona un pendiente y usa el planificador inferior.</p>
              {selectedPendingJobId && (
                <p className="pending-touch-hint">Pendiente seleccionado: usa Empleado + Hora y pulsa "Asignar pendiente".</p>
              )}

              <div className="pending-list">
                {pendingJobs.length === 0 && (
                  <p className="empty-hint">No hay servicios pendientes por asignar.</p>
                )}
                {pendingJobs.map((trabajo) => (
                  <div
                    key={trabajo.id_trabajo}
                    className={`drag-job${draggingJobId === trabajo.id_trabajo ? ' dragging' : ''}${Number(selectedPendingJobId) === Number(trabajo.id_trabajo) ? ' selected' : ''}`}
                    draggable={!isCompactCalendarView}
                    onDragStart={(event) => onDragStartPending(event, trabajo)}
                    onDragEnd={onDragEnd}
                    onClick={() => onSelectPendingTrabajo(trabajo.id_trabajo)}
                  >
                    <div className="drag-job-head">
                      <p className="drag-job-title">{trabajo.cliente?.nombre || 'Cliente sin nombre'}</p>
                      <span className="drag-job-state">{trabajo.estado}</span>
                    </div>
                    <p className="drag-job-meta">Asignadas {trabajo.personas_asignadas || 0}/{requiredPeopleOf(trabajo)}</p>
                    {trabajo.fecha_inicio && <p className="drag-job-meta">{formatDate(trabajo.fecha_inicio)}</p>}
                    {!trabajo.fecha_inicio && trabajo.dia_semana !== null && trabajo.dia_semana !== undefined && (
                      <p className="drag-job-meta">Dia: {weekdayLabelFromNumber(trabajo.dia_semana)}</p>
                    )}
                    <p className="drag-job-desc">{trabajo.descripcion_tarea}</p>
                    {trabajo.ubicacion && <p className="drag-job-foot">{trabajo.ubicacion}</p>}
                    <button
                      type="button"
                      className="action-btn pending-select-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectPendingTrabajo(trabajo.id_trabajo);
                      }}
                    >
                      {Number(selectedPendingJobId) === Number(trabajo.id_trabajo) ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                  </div>
                ))}
              </div>
            </aside>

            <section className="calendar-mobile-planner" aria-label="Planificador movil">
              <div className="calendar-mobile-box">
                <h3>Asignar pendiente (movil)</h3>
                <p className="pending-help">Selecciona un pendiente, elige empleado y hora, y confirma.</p>

                <div className="calendar-mobile-step">
                  <p className="calendar-mobile-step-label">Paso 1: Servicio seleccionado</p>
                  {selectedPendingTrabajo ? (
                    <div className="calendar-mobile-selected">
                      <p className="calendar-mobile-title">{selectedPendingTrabajo.cliente?.nombre || 'Cliente sin nombre'}</p>
                      <p className="calendar-mobile-meta">{selectedPendingTrabajo.descripcion_tarea}</p>
                      <button type="button" className="ghost-btn" onClick={onClearSelectedPendingTrabajo}>Quitar seleccion</button>
                    </div>
                  ) : (
                    <p className="empty-hint">No hay pendiente seleccionado. Pulsa "Seleccionar" en un servicio pendiente.</p>
                  )}
                </div>

                <div className="calendar-mobile-form">
                  <p className="calendar-mobile-step-label">Paso 2: Asignar</p>
                  <label>
                    Empleado
                    <select
                      value={mobileAssignEmpleadoId}
                      onChange={(event) => setMobileAssignEmpleadoId(event.target.value)}
                    >
                      <option value="">Selecciona empleado...</option>
                      {empleados.map((empleado) => (
                        <option key={`mobile-emp-${empleado.id_usuario}`} value={empleado.id_usuario}>
                          {`${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim() || empleado.username}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Hora de inicio
                    <select
                      value={mobileAssignSlot}
                      onChange={(event) => setMobileAssignSlot(event.target.value)}
                    >
                      {CALENDAR_SLOTS.map((slot) => (
                        <option key={`mobile-slot-${slot.value}`} value={slot.value}>{slot.value}</option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="solid-btn"
                    onClick={onAssignSelectedPendingMobile}
                    disabled={!selectedPendingJobId || isSavingSchedule}
                  >
                    {isSavingSchedule ? 'Guardando...' : 'Asignar pendiente'}
                  </button>
                </div>
              </div>

              <div className="calendar-mobile-box">
                <h3>Servicios del dia</h3>
                <p className="pending-help">Vista rapida para reprogramar o devolver a pendientes.</p>
                <div className="calendar-mobile-form">
                  <label>
                    Filtrar por empleado
                    <select
                      value={mobileFilterEmpleadoId}
                      onChange={(event) => setMobileFilterEmpleadoId(event.target.value)}
                    >
                      <option value="">Todos</option>
                      {empleados.map((empleado) => (
                        <option key={`mobile-filter-${empleado.id_usuario}`} value={empleado.id_usuario}>
                          {`${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim() || empleado.username}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="calendar-mobile-list">
                  {mobileCalendarRowsFiltered.length === 0 && (
                    <p className="empty-hint">No hay servicios asignados para el filtro actual.</p>
                  )}
                  {mobileCalendarRowsFiltered.map((row) => (
                    <article
                      key={`mobile-row-${row.trabajo.id_trabajo}-${row.asignacion.id_asignacion}`}
                      className="calendar-mobile-item"
                    >
                      <p className="calendar-mobile-title">{row.trabajo.cliente?.nombre || 'Cliente'}</p>
                      <p className="calendar-mobile-meta">{hourFromDate(row.start)} - {row.end ? hourFromDate(row.end) : '--:--'} Â· {row.empleadoNombre}</p>
                      <p className="calendar-mobile-meta">{row.trabajo.descripcion_tarea}</p>
                      <div className="calendar-mobile-actions">
                        <span className="status-chip pending">{estadoTrabajoLabel(row.trabajo.estado)}</span>
                        {Number(mobileEditingAsignacionId) === Number(row.asignacion.id_asignacion) ? (
                          <div className="calendar-mobile-edit-form">
                            <label>
                              Empleado
                              <select value={mobileEditEmpleadoId} onChange={(event) => setMobileEditEmpleadoId(event.target.value)}>
                                <option value="">Selecciona empleado...</option>
                                {empleados.map((empleado) => (
                                  <option key={`mobile-edit-emp-${empleado.id_usuario}`} value={empleado.id_usuario}>
                                    {`${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim() || empleado.username}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Hora de inicio
                              <select value={mobileEditSlot} onChange={(event) => setMobileEditSlot(event.target.value)}>
                                {CALENDAR_SLOTS.map((slot) => (
                                  <option key={`mobile-edit-slot-${slot.value}`} value={slot.value}>{slot.value}</option>
                                ))}
                              </select>
                            </label>
                            <div className="calendar-mobile-inline-actions">
                              <button type="button" className="solid-btn" onClick={() => onSaveMobileEditAssignment(row)} disabled={isSavingSchedule}>
                                {isSavingSchedule ? 'Guardando...' : 'Guardar cambio'}
                              </button>
                              <button type="button" className="ghost-btn" onClick={onCancelMobileEditAssignment} disabled={isSavingSchedule}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => onStartMobileEditAssignment(row)}
                            disabled={isSavingSchedule}
                          >
                            Reprogramar
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => onMoveMobileRowToPending(row)}
                          disabled={isSavingSchedule}
                        >
                          Devolver a pendientes
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <div className="calendar-grid-panel">
              {totalCalendarPages > 1 && (
                <div className="calendar-pagination">
                  <button
                    className="cal-page-btn"
                    disabled={calendarEmpleadoPage === 0}
                    onClick={() => setCalendarEmpleadoPage((p) => p - 1)}
                  >
                    â€¹ Anterior
                  </button>
                  <span className="cal-page-info">
                    {calendarEmpleadoPage + 1} / {totalCalendarPages}
                  </span>
                  <button
                    className="cal-page-btn"
                    disabled={calendarEmpleadoPage >= totalCalendarPages - 1}
                    onClick={() => setCalendarEmpleadoPage((p) => p + 1)}
                  >
                    Siguiente â€º
                  </button>
                </div>
              )}

              <div className="calendar-grid-wrap">
              <div
                className="calendar-grid daily"
                style={{
                  gridTemplateColumns: `88px repeat(${empleadosPaginados.length || 1}, 180px)`,
                  width: 'max-content',
                }}
              >
                {calendarNowIndicator && (
                  <div
                    className="calendar-now-line"
                    style={{ '--minutes-from-start': calendarNowIndicator.minutesFromStart }}
                  >
                    <span className="calendar-now-badge">{calendarNowIndicator.label}</span>
                  </div>
                )}
                <div className="calendar-cell time-header">Hora</div>
                {empleadosPaginados.map((empleado) => (
                  <div key={`head-${empleado.id_usuario}`} className="calendar-cell col-header">
                    {`${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim() || empleado.username}
                  </div>
                ))}

                {CALENDAR_SLOTS.map((slot) => (
                  <div key={`slot-row-${slot.value}`} className="calendar-row-group">
                    <div className="calendar-cell time-cell">{slotLabel(slot.hour, slot.minute)}</div>
                    {empleadosPaginados.map((empleado) => {
                      const cellKey = `${empleado.id_usuario}-${selectedDateKey}-${slot.hour}-${slot.minute}`;
                      const items = jobsByEmployeeSlot[`${empleado.id_usuario}-${slot.hour}-${slot.minute}`] || [];
                      const isDropAnchor = dragOverKey === cellKey && dragOverRangeKeys.length > 0;
                      const previewSlots = Math.max(1, dragOverRangeKeys.length || 1);
                      return (
                        <div
                          key={`${empleado.id_usuario}-${selectedDateKey}-${slot.value}`}
                          className={`calendar-cell dropzone${isDropAnchor ? ' is-over-anchor' : ''}`}
                          onDragOver={(event) => onDragOverCell(event, empleado.id_usuario, selectedDate, slot.hour, slot.minute)}
                          onDrop={(event) => onDropJob(event, empleado.id_usuario, selectedDate, slot.hour, slot.minute)}
                          onClick={() => onTapAssignToCell(empleado.id_usuario, selectedDate, slot.hour, slot.minute)}
                        >
                          {isDropAnchor && (
                            <div
                              className="calendar-drop-preview"
                              style={{ height: `calc(${previewSlots} * var(--slot-row-height) - 8px)` }}
                            />
                          )}
                          {items.map((trabajo) => (
                            trabajo.__slotStart ? (
                              <div
                                key={`${trabajo.id_trabajo}-${trabajo.__asignacion.id_asignacion}`}
                                className={`calendar-job spanning${draggingJobId === trabajo.id_trabajo ? ' dragging' : ''}`}
                                style={{ height: `calc(${trabajo.__slotSpan} * var(--slot-row-height) - 8px)` }}
                                draggable={!isCompactCalendarView}
                                onDragStart={(event) => onDragStartAssignment(event, trabajo, trabajo.__asignacion)}
                                onDragEnd={onDragEnd}
                              >
                                <div className="calendar-job-head">
                                  <p>{trabajo.cliente?.nombre || 'Cliente'}</p>
                                </div>
                                <small className="calendar-job-status">{trabajo.estado}</small>
                                <span className="calendar-inline-status">
                                  {estadoTrabajoLabel(trabajo.estado)}
                                </span>
                              </div>
                            ) : null
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </article>
      </section>
    );
  };

  const renderEmpleadosModule = () => {
    return (
      <section className="module-layout">
        <article className="module-card">
          <header className="module-header">
            <h2>Empleados</h2>
            <p>Gestiona el equipo operativo: alta, edicion y eliminacion de usuarios.</p>
          </header>
          <div className="records-list">
            {filteredEmpleados.map((empleado) => {
              const fullName = `${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim() || '-';
              const initialsSource = `${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim() || empleado.username || '?';
              const initials = initialsSource
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join('') || '?';

              return (
                <div key={empleado.id_usuario} className="record-item">
                  <div className="record-main employee-card-main">
                    <div className="employee-card-head">
                      <div className="employee-avatar-mini" aria-hidden="true">
                        {empleado.avatar_url ? (
                          <img src={empleado.avatar_url} alt="" className="employee-avatar-mini-image" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div>
                        <p className="record-title">{fullName}</p>
                        <p className="record-subtitle">Usuario: {empleado.username}</p>
                        <p className="record-subtitle">Rol: {empleado.rol}</p>
                      </div>
                    </div>
                  </div>
                  <div className="record-actions">
                    <button type="button" className="action-btn" onClick={() => onEditEmpleado(empleado)}>Editar</button>
                    <button type="button" className="action-btn danger" onClick={() => onDeleteEmpleado(empleado.id_usuario)}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="module-card">
          <header className="module-header compact">
            <h3>{editEmployeeId ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          </header>
          <form className="stack-form" onSubmit={onSubmitEmpleado}>
            <input
              type="text"
              placeholder="Nombre"
              value={employeeForm.nombre}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, nombre: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Apellidos"
              value={employeeForm.apellidos}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, apellidos: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Usuario"
              value={employeeForm.username}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
            <input
              type="password"
              placeholder={editEmployeeId ? 'ContraseÃ±a (opcional)' : 'ContraseÃ±a'}
              value={employeeForm.password}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, password: event.target.value }))}
              minLength={editEmployeeId ? undefined : 6}
              required={!editEmployeeId}
            />
            <select
              value={employeeForm.rol}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, rol: event.target.value }))}
              required
            >
              <option value="Empleado">Empleado</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="form-actions">
              <button type="submit" className="solid-btn">{editEmployeeId ? 'Guardar cambios' : 'Crear usuario'}</button>
              {editEmployeeId && (
                <button type="button" className="ghost-btn" onClick={resetEmployeeForm}>Cancelar</button>
              )}
            </div>
          </form>
        </article>
      </section>
    );
  };

  const renderMiAgendaModule = () => {
    const jornadaAbierta = Boolean(jornadaActual?.hora_inicio && !jornadaActual?.hora_fin);
    const jornadaCerradaHoy = Boolean(jornadaActual?.hora_inicio && jornadaActual?.hora_fin);
    const jornadaStateLabel = jornadaAbierta ? 'Jornada activa' : (jornadaCerradaHoy ? 'Jornada cerrada' : 'Sin fichar hoy');
    const jornadaStateTone = jornadaAbierta ? 'open' : (jornadaCerradaHoy ? 'closed' : 'idle');
    const jornadaWorkedMinutes = jornadaActual?.hora_inicio
      ? diffMinutesSafe(jornadaActual.hora_inicio, jornadaAbierta ? nowTick : jornadaActual.hora_fin)
      : 0;
    const jornadaRecommendedAction = jornadaAbierta ? 'Cerrar jornada' : 'Iniciar jornada';
    const agendaStats = employeeAgenda.reduce((acc, row) => {
      const estado = normalizeEstadoTrabajo(row.trabajo.estado);
      acc.total += 1;
      if (estado === 'pendiente') acc.pendientes += 1;
      if (estado === 'en_curso') acc.enCurso += 1;
      if (estado === 'pausado') acc.pausados += 1;
      if (estado === 'finalizado') acc.finalizados += 1;
      return acc;
    }, { total: 0, pendientes: 0, enCurso: 0, pausados: 0, finalizados: 0 });

    const filters = [
      { key: 'todos', label: `Todos (${agendaStats.total})` },
      { key: 'pendiente', label: `Pendientes (${agendaStats.pendientes})` },
      { key: 'en_curso', label: `En curso (${agendaStats.enCurso})` },
      { key: 'pausado', label: `Pausados (${agendaStats.pausados})` },
      { key: 'finalizado', label: `Finalizados (${agendaStats.finalizados})` },
    ];

    return (
      <section className="module-layout single">
        <article className="module-card">
          <header className="module-header">
            <h2>Mi dia</h2>
            <p>Apartados claros para trabajar rapido: primero fichaje de jornada y despues fichaje por trabajo.</p>
          </header>

          <section className="employee-section-block" aria-label="Apartado de fichaje de jornada">
            <header className="module-header compact employee-section-header">
              <h3>1) Fichaje de jornada</h3>
              <p>Fichaje legal diario y seguimiento del tiempo trabajado en tiempo real.</p>
            </header>

            <div className="jornada-panel">
              <div className="jornada-panel-head">
                <div>
                  <p className="jornada-panel-label">Estado actual</p>
                  <p className={`jornada-state-pill ${jornadaStateTone}`}>{jornadaStateLabel}</p>
                </div>
                <div className="jornada-worked-box">
                  <p className="jornada-panel-label">Tiempo acumulado hoy</p>
                  <p className="jornada-worked-value">{formatMinutes(jornadaWorkedMinutes)}</p>
                </div>
              </div>

              <div className="jornada-timeline">
                <p>Entrada: {jornadaActual?.hora_inicio ? formatDateTime(jornadaActual.hora_inicio) : '--'}</p>
                <p>Salida: {jornadaActual?.hora_fin ? formatDateTime(jornadaActual.hora_fin) : '--'}</p>
              </div>

              <div className="jornada-actions">
                <button
                  type="button"
                  className={`jornada-btn ${!jornadaAbierta ? 'solid-btn jornada-btn-primary' : 'ghost-btn'}`}
                  onClick={onIniciarJornada}
                  disabled={jornadaAbierta || isSavingJornada}
                >
                  {isSavingJornada ? 'Guardando...' : 'Iniciar jornada'}
                </button>
                <button
                  type="button"
                  className={`jornada-btn ${jornadaAbierta ? 'solid-btn jornada-btn-primary' : 'ghost-btn'}`}
                  onClick={onFinalizarJornada}
                  disabled={!jornadaAbierta || isSavingJornada}
                >
                  {isSavingJornada ? 'Guardando...' : 'Cerrar jornada'}
                </button>
              </div>

              <p className="jornada-cta-hint">Accion recomendada ahora: <strong>{jornadaRecommendedAction}</strong></p>
            </div>

            {jornadaActual?.hora_inicio && (
              <p className="jornada-status-line">
                {jornadaAbierta
                  ? `Jornada abierta desde ${formatDateTime(jornadaActual.hora_inicio)}`
                  : `Ultima jornada cerrada: ${formatDateTime(jornadaActual.hora_inicio)} - ${formatDateTime(jornadaActual.hora_fin)}`}
              </p>
            )}
          </section>

          <section className="employee-section-block" aria-label="Apartado de fichaje por trabajo">
            <header className="module-header compact employee-section-header employee-agenda-header">
              <h3>2) Fichaje por trabajo</h3>
              <p>Selecciona el dia, filtra por estado y ejecuta la accion del trabajo.</p>
            </header>

            <div className="calendar-day-nav">
              <button
                type="button"
                className="day-nav-btn"
                onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
              >
                Dia anterior
              </button>

              <div className="day-nav-center">
                <p className="calendar-day-title">{fullDateLabel(selectedDate)}</p>
                <div className="day-strip" role="tablist" aria-label="Navegacion de dias">
                  {dayStrip.map((day) => {
                    const chipKey = dateKey(day);
                    const isActive = chipKey === selectedDateKey;
                    return (
                      <button
                        key={chipKey}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`day-chip${isActive ? ' active' : ''}`}
                        onClick={() => setSelectedDate(normalizeDay(day))}
                      >
                        {dayChipLabel(day)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="day-actions">
                <button
                  type="button"
                  className="day-nav-btn"
                  onClick={() => setSelectedDate(normalizeDay(new Date()))}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className="day-nav-btn"
                  onClick={() => setSelectedDate((prev) => normalizeDay(addDays(prev, 1)))}
                >
                  Dia siguiente
                </button>
              </div>
            </div>

            <div className="employee-agenda-filters" role="tablist" aria-label="Filtro por estado de agenda">
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={employeeAgendaFilter === item.key}
                  className={`employee-filter-chip${employeeAgendaFilter === item.key ? ' active' : ''}`}
                  onClick={() => setEmployeeAgendaFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="records-list">
              {employeeAgendaFiltered.length === 0 && (
                <div className="record-item">
                  <div className="record-main">
                    <p className="record-subtitle">
                      {employeeAgenda.length === 0
                        ? 'No tienes servicios asignados para este dia.'
                        : 'No hay servicios para el filtro seleccionado.'}
                    </p>
                  </div>
                </div>
              )}

              {employeeAgendaFiltered.map(({ trabajo, asignacion }) => (
                <div key={`${trabajo.id_trabajo}-${asignacion.id_asignacion}`} className="record-item agenda-record-item">
                  <div className="record-main">
                    <p className="record-title">{trabajo.cliente?.nombre || 'Cliente'}</p>
                    <p className="record-subtitle">{hourFromDate(asignacion.fecha_inicio)} - {hourFromDate(asignacion.fecha_fin)}</p>
                    <p className="record-subtitle">{trabajo.descripcion_tarea}</p>
                    <p className="record-subtitle">Estimado: {formatMinutes(trabajo.tiempo_estimado || trabajo.duracion_minutos)}</p>
                    {normalizeEstadoTrabajo(trabajo.estado) === 'finalizado' && (
                      <p className="record-subtitle">Real efectivo: {formatMinutes(trabajo.tiempo_real_efectivo)}</p>
                    )}
                  </div>
                  <div className="record-actions employee-task-actions">
                    <span className={`status-chip ${normalizeEstadoTrabajo(trabajo.estado) === 'finalizado' ? 'ok' : 'pending'}`}>
                      {estadoTrabajoLabel(trabajo.estado)}
                    </span>

                    {normalizeEstadoTrabajo(trabajo.estado) === 'pendiente' && (
                      <button
                        type="button"
                        className="action-btn employee-task-btn"
                        onClick={() => onTrabajoAction(trabajo.id_trabajo, 'iniciar')}
                        disabled={Number(completingTrabajoId) === Number(trabajo.id_trabajo) || isUpdatingTrabajo}
                      >
                        {Number(completingTrabajoId) === Number(trabajo.id_trabajo) ? 'Guardando...' : 'Iniciar'}
                      </button>
                    )}

                    {normalizeEstadoTrabajo(trabajo.estado) === 'en_curso' && (
                      <>
                        <button
                          type="button"
                          className="action-btn employee-task-btn"
                          onClick={() => onTrabajoAction(trabajo.id_trabajo, 'pausar')}
                          disabled={Number(completingTrabajoId) === Number(trabajo.id_trabajo) || isUpdatingTrabajo}
                        >
                          {Number(completingTrabajoId) === Number(trabajo.id_trabajo) ? 'Guardando...' : 'Pausar'}
                        </button>
                        <button
                          type="button"
                          className="solid-btn employee-task-btn"
                          onClick={() => onFinalizarTrabajo(trabajo)}
                          disabled={Number(completingTrabajoId) === Number(trabajo.id_trabajo) || isUpdatingTrabajo}
                        >
                          {Number(completingTrabajoId) === Number(trabajo.id_trabajo) ? 'Guardando...' : 'Finalizar'}
                        </button>
                      </>
                    )}

                    {normalizeEstadoTrabajo(trabajo.estado) === 'pausado' && (
                      <button
                        type="button"
                        className="action-btn employee-task-btn"
                        onClick={() => onTrabajoAction(trabajo.id_trabajo, 'reanudar')}
                        disabled={Number(completingTrabajoId) === Number(trabajo.id_trabajo) || isUpdatingTrabajo}
                      >
                        {Number(completingTrabajoId) === Number(trabajo.id_trabajo) ? 'Guardando...' : 'Reanudar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </article>
      </section>
    );
  };

  const renderAuditoriaLegalModule = () => {
    return (
      <section className="module-layout single">
        <article className="module-card module-page">
          <header className="module-header">
            <h2>Auditoria legal de jornada</h2>
            <p>Trazabilidad de fichajes y modificaciones administrativas para inspecciones.</p>
            {renderDateRangeFilter()}
            <div className="jornada-actions">
              <button type="button" className="action-btn" onClick={() => loadModuleData('auditoria-legal', { force: true, showLoader: false })}>
                Actualizar
              </button>
              <button type="button" className="solid-btn jornada-btn" onClick={onExportAuditoriaCsv}>
                Exportar a CSV
              </button>
            </div>
          </header>

          <div className="table-wrap">
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Referencia</th>
                  <th>Responsable</th>
                  <th>Detalle</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {auditoriaPrincipalRows.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay registros de auditoria.</td>
                  </tr>
                )}
                {auditoriaPrincipalRows.map((item) => {
                  return (
                    <tr key={item.id} className={item.tipo === 'Ajuste trabajo' ? 'audit-row-modified' : ''}>
                      <td>{formatDateTime(item.fecha)}</td>
                      <td>{item.tipo}</td>
                      <td>{item.referencia}</td>
                      <td>{item.responsable}</td>
                      <td>{item.detalle}</td>
                      <td>{item.motivo || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-wrap" style={{ marginTop: '0.85rem' }}>
            <h3 style={{ margin: '0 0 0.6rem', color: 'var(--brand-900)' }}>Ajuste admin de trabajos realizados</h3>
            <table className="bi-table">
              <thead>
                <tr>
                  <th>Trabajo</th>
                  <th>Empleado</th>
                  <th>Estimado</th>
                  <th>Real</th>
                  <th>Justificacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trabajosRealizados.length === 0 && (
                  <tr>
                    <td colSpan={6}>No hay trabajos realizados en el rango actual.</td>
                  </tr>
                )}
                {trabajosRealizados.map((trabajo) => {
                  const estimado = toNumeric(trabajo.tiempo_estimado || trabajo.duracion_minutos, 0);
                  const real = toNumeric(trabajo.tiempo_real_efectivo, 0);
                  const empleadoNombre = `${trabajo.empleado?.nombre || ''} ${trabajo.empleado?.apellidos || ''}`.trim() || trabajo.empleado?.username || 'Sin empleado';
                  const tituloTrabajo = trabajo.descripcion_tarea || `Trabajo #${trabajo.id_trabajo}`;

                  return (
                    <tr key={`retraso-${trabajo.id_trabajo}`}>
                      <td>{tituloTrabajo}</td>
                      <td>{empleadoNombre}</td>
                      <td>{formatMinutes(estimado)}</td>
                      <td>{formatMinutes(real)}</td>
                      <td>{trabajo.notas_empleado || '-'}</td>
                      <td>
                        <button type="button" className="action-btn" onClick={() => onOpenEditRetraso(trabajo)}>
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </article>
      </section>
    );
  };

  const renderRentabilidadModule = () => {
    const employeeRows = [...eficienciaEmpleados].sort((a, b) => (a.desviacion_total_min || 0) - (b.desviacion_total_min || 0));
    const clienteRows = [...desviacionClientes].sort((a, b) => Math.abs(b.desviacion_total_min || 0) - Math.abs(a.desviacion_total_min || 0));

    const totalTrabajos = employeeRows.reduce((sum, item) => sum + Number(item.total_trabajos_finalizados || 0), 0);
    const totalEstimado = employeeRows.reduce((sum, item) => sum + Number(item.total_estimado_min || 0), 0);
    const totalReal = employeeRows.reduce((sum, item) => sum + Number(item.total_real_efectivo_min || 0), 0);
    const desviacionGlobal = totalReal - totalEstimado;
    const eficienciaGlobal = totalReal > 0 ? ((totalEstimado / totalReal) * 100) : 0;
    const topDesvioCliente = clienteRows[0] || null;

    return (
      <section className="module-layout single">
        <article className="module-card module-page rentabilidad-page">
          <header className="module-header">
            <h2>Panel de rentabilidad</h2>
            <p>Vista rapida de productividad: quien va en tiempo y donde se acumulan desviaciones.</p>
            {renderDateRangeFilter()}
          </header>

          <div className="bi-summary-grid">
            <article className="bi-summary-card">
              <p className="bi-summary-label">Trabajos analizados</p>
              <p className="bi-summary-value">{totalTrabajos}</p>
            </article>
            <article className="bi-summary-card">
              <p className="bi-summary-label">Eficiencia global</p>
              <p className="bi-summary-value">{eficienciaGlobal > 0 ? `${eficienciaGlobal.toFixed(1)}%` : '--'}</p>
              <p className="bi-summary-hint">Estimado {formatMinutes(totalEstimado)} vs real {formatMinutes(totalReal)}</p>
            </article>
            <article className="bi-summary-card">
              <p className="bi-summary-label">Desviacion total</p>
              <p className={`bi-summary-value ${desviacionTone(desviacionGlobal).key}`}>{desviacionGlobal >= 0 ? '+' : ''}{desviacionGlobal} min</p>
              <p className="bi-summary-hint">{desviacionTone(desviacionGlobal).label}</p>
            </article>
            <article className="bi-summary-card">
              <p className="bi-summary-label">Mayor foco cliente</p>
              <p className="bi-summary-value bi-summary-client">{topDesvioCliente?.cliente_nombre || '--'}</p>
              <p className="bi-summary-hint">{topDesvioCliente ? `${topDesvioCliente.desviacion_total_min >= 0 ? '+' : ''}${topDesvioCliente.desviacion_total_min} min` : 'Sin datos'}</p>
            </article>
          </div>

          <div className="bi-grid">
            <section className="bi-card">
              <h3>Ranking de empleados (mejor a peor desviacion)</h3>
              <div className="table-wrap">
                <table className="bi-table bi-table-mobile-cards">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Trabajos</th>
                      <th>Estimado</th>
                      <th>Real</th>
                      <th>Balance</th>
                      <th>Eficiencia neta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeRows.length === 0 && (
                        <tr className="bi-empty-row">
                          <td className="bi-empty-cell" colSpan={6}>Sin datos de eficiencia todavia.</td>
                      </tr>
                    )}
                    {employeeRows.map((item) => {
                      const fullName = `${item.empleado?.nombre || ''} ${item.empleado?.apellidos || ''}`.trim() || item.empleado?.username || `Empleado #${item.empleado_id}`;
                      const tone = desviacionTone(item.desviacion_total_min);
                      const ratio = Number(item.eficiencia_neta_pct || 0);
                      const ratioBounded = Math.min(140, Math.max(0, ratio));
                      return (
                        <tr key={`eff-${item.empleado_id}`}>
                          <td data-label="Empleado">{fullName}</td>
                          <td data-label="Trabajos">{item.total_trabajos_finalizados}</td>
                          <td data-label="Estimado">{formatMinutes(item.total_estimado_min)}</td>
                          <td data-label="Real">{formatMinutes(item.total_real_efectivo_min)}</td>
                          <td data-label="Balance">
                            <span className={`bi-tone-chip ${tone.key}`}>
                              {tone.label}: {item.desviacion_total_min >= 0 ? '+' : ''}{item.desviacion_total_min} min
                            </span>
                          </td>
                          <td data-label="Eficiencia neta">
                            <div className="bi-efficiency-cell">
                              <span className="bi-efficiency-value">{item.eficiencia_neta_pct ? `${item.eficiencia_neta_pct}%` : '--'}</span>
                              <div className="bi-efficiency-track" aria-hidden="true">
                                <span className="bi-efficiency-fill" style={{ width: `${ratioBounded}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bi-card">
              <h3>Clientes y ubicaciones con mayor desviacion</h3>
              <div className="table-wrap">
                <table className="bi-table bi-table-mobile-cards">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Ubicacion</th>
                      <th>Trabajos</th>
                      <th>Estimado</th>
                      <th>Real</th>
                      <th>Desviacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clienteRows.length === 0 && (
                        <tr className="bi-empty-row">
                          <td className="bi-empty-cell" colSpan={6}>Sin desviaciones calculadas todavia.</td>
                      </tr>
                    )}
                    {clienteRows.map((item, index) => {
                      const tone = desviacionTone(item.desviacion_total_min);
                      return (
                        <tr key={`dev-${item.cliente_id}-${index}`}>
                            <td data-label="Cliente">{item.cliente_nombre}</td>
                            <td data-label="Ubicacion">{item.ubicacion}</td>
                            <td data-label="Trabajos">{item.total_trabajos_finalizados}</td>
                            <td data-label="Estimado">{formatMinutes(item.total_estimado_min)}</td>
                            <td data-label="Real">{formatMinutes(item.total_real_efectivo_min)}</td>
                            <td data-label="Desviacion">
                            <span className={`bi-tone-chip ${tone.key}`}>
                              {item.desviacion_total_min >= 0 ? '+' : ''}{item.desviacion_total_min} min
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </article>
      </section>
    );
  };

  const renderPerfilModule = () => {
    const avatarSrc = profileAvatarPreview || (!removeProfileAvatar ? user.avatar_url : '') || '';

    return (
      <section className="module-layout single">
        <article className="module-card profile-page">
          <header className="module-header profile-header">
            <h2>Mi perfil</h2>
            <p>Actualiza tu informacion personal, foto y contraseÃ±a.</p>
          </header>

          <form className="profile-grid" onSubmit={onSubmitProfile}>
            <section className="profile-avatar-panel">
              <div className="profile-avatar-wrap">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar de perfil" className="profile-avatar-image" />
                ) : (
                  <div className="profile-avatar-fallback">
                    {(profileForm.username || user.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <label className="action-btn profile-file-label" htmlFor="profile-avatar-input">Subir imagen</label>
              <input
                id="profile-avatar-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onProfileAvatarSelected}
              />
              <button type="button" className="ghost-btn" onClick={onRemoveProfileAvatar}>Quitar imagen</button>
              <p className="profile-help">Formatos: JPG, PNG, WEBP. Maximo 2MB.</p>
            </section>

            <section className="profile-form-panel">
              <div className="stack-form profile-form">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={profileForm.nombre}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={profileForm.apellidos}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, apellidos: event.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Usuario"
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
                  required
                />
                <input
                  type="password"
                  placeholder="Nueva contraseÃ±a (opcional)"
                  value={profileForm.password}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={6}
                />

                <div className="form-actions">
                  <button type="submit" className="solid-btn" disabled={isSavingProfile}>
                    {isSavingProfile ? 'Guardando...' : 'Guardar perfil'}
                  </button>
                </div>
              </div>
            </section>
          </form>
        </article>
      </section>
    );
  };

  const renderModule = () => {
    if (!isAdmin) {
      if (activeModule === 'perfil') return renderPerfilModule();
      return renderMiAgendaModule();
    }
    if (activeModule === 'clientes') return renderClientesModule();
    if (activeModule === 'bandeja') return renderBandejaModule();
    if (activeModule === 'trabajos') return renderTrabajosModule();
    if (activeModule === 'calendario') return renderCalendarioModule();
    if (activeModule === 'auditoria-legal') return renderAuditoriaLegalModule();
    if (activeModule === 'rentabilidad') return renderRentabilidadModule();
    if (activeModule === 'perfil') return renderPerfilModule();
    return renderEmpleadosModule();
  };

  const moduleTransitionKey = activeModule;

  const hasPendingInboxNotification = pendingInboxCount > acknowledgedInboxCount;
  const hasSystemNotifications = formNotifications.length > 0 || hasPendingInboxNotification;
  const activeModuleLabel = activeModule === 'perfil'
    ? 'Mi perfil'
    : (modules.find((item) => item.key === activeModule)?.label || 'Dashboard');
  const mobileEmployeeTabs = [
    { key: 'mi-agenda', label: 'Mi dia' },
    { key: 'perfil', label: 'Perfil' },
  ];

  const sidebarInitials = (user.username || '?').slice(0, 2).toUpperCase();

  return (
    <div className={`dashboard-page ${isAdmin ? 'is-admin' : 'is-employee'}`}>
      <aside className={`dashboard-sidebar${isMobileNavOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-backdrop" />
        <div className="sidebar-content">
          <div className="sidebar-brand">
            <img src={ASSETS.LOGO_B} alt="EZLO" className="sidebar-brand-logo" />
          </div>

          <nav className="sidebar-nav" aria-label="Navegacion principal del dashboard">
            {modules.map((moduleItem) => (
              <button
                key={moduleItem.key}
                type="button"
                className={`sidebar-link${activeModule === moduleItem.key ? ' active' : ''}`}
                onClick={() => onNavModuleSelect(moduleItem.key)}
              >
                {moduleItem.label}
              </button>
            ))}

            {!isAdmin && (
              <button
                type="button"
                className={`sidebar-link${activeModule === 'perfil' ? ' active' : ''}`}
                onClick={onOpenProfile}
              >
                Mi perfil
              </button>
            )}
          </nav>

          <button
            type="button"
            className="sidebar-user sidebar-user-trigger"
            onClick={onOpenProfile}
            aria-label="Abrir mi perfil"
          >
            <div className="sidebar-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="sidebar-avatar-image" />
              ) : (
                sidebarInitials
              )}
            </div>
            <div>
              <p className="sidebar-username">{user.username}</p>
              <p className="sidebar-role">{user.rol}</p>
            </div>
          </button>
        </div>
      </aside>

      {isMobileNavOpen && (
        <button
          type="button"
          className="sidebar-mobile-overlay"
          aria-label="Cerrar navegacion"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <main ref={dashboardMainRef} className="dashboard-main">
        <header className="dashboard-topbar topbar-minimal">
          <div className="topbar-leading">
            <button
              type="button"
              className="mobile-nav-toggle"
              aria-label="Abrir menu"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
            >
              <svg className="mobile-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M4 7h16a1 1 0 1 0 0-2H4a1 1 0 1 0 0 2Zm16 4H4a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2Zm0 6H4a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2Z" />
              </svg>
            </button>

            <div className="mobile-topbar-context" aria-live="polite">
              <p className="mobile-topbar-title">{activeModuleLabel}</p>
            </div>
          </div>

          <div className="topbar-actions topbar-actions-minimal">
            <button
              type="button"
              className="notification-inline-btn"
              aria-label="Notificaciones"
              aria-expanded={isNotificationPanelOpen}
              aria-controls="topbar-notifications-panel"
              onClick={() => setIsNotificationPanelOpen((prev) => !prev)}
            >
              <svg className="notification-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 3a6 6 0 0 0-6 6v2.6l-1.2 2.7A2 2 0 0 0 6.6 17h10.8a2 2 0 0 0 1.8-2.7L18 11.6V9a6 6 0 0 0-6-6Zm0 18a2.8 2.8 0 0 0 2.7-2h-5.4A2.8 2.8 0 0 0 12 21Z" />
              </svg>
              {hasSystemNotifications && <span className="notification-dot" aria-hidden="true" />}
            </button>
            <button type="button" className="logout-inline-btn" onClick={handleLogout}>
              <svg className="logout-inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M15.5 3.5h-7A2.5 2.5 0 0 0 6 6v12a2.5 2.5 0 0 0 2.5 2.5h7A2.5 2.5 0 0 0 18 18v-2.2a1 1 0 1 0-2 0V18a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 8 18V6a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2.2a1 1 0 1 0 2 0V6a2.5 2.5 0 0 0-2.5-2.5Zm-1.8 7.5H9.9a1 1 0 1 0 0 2h3.8l-1.1 1.1a1 1 0 1 0 1.4 1.4l2.8-2.8a1 1 0 0 0 0-1.4l-2.8-2.8a1 1 0 1 0-1.4 1.4l1.1 1.1Z" />
              </svg>
              <span className="logout-inline-label">Salir</span>
            </button>
          </div>

          {isNotificationPanelOpen && (
            <div id="topbar-notifications-panel" className="topbar-notification-panel" role="dialog" aria-label="Notificaciones">
              <div className="topbar-notification-header">
                <p>Notificaciones</p>
                {hasSystemNotifications && (
                  <button
                    type="button"
                    className="topbar-notification-clear"
                    onClick={() => {
                      setFormNotifications([]);
                      setAcknowledgedInboxCount(pendingInboxCount);
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="topbar-notification-list">
                {hasPendingInboxNotification && (
                  <div className="topbar-notification-item info">
                    <p>
                      {pendingInboxCount === 1
                        ? 'Tienes 1 formulario pendiente en bandeja.'
                        : `Tienes ${pendingInboxCount} formularios pendientes en bandeja.`}
                    </p>
                    <div className="topbar-notification-actions">
                      <button
                        type="button"
                        className="topbar-notification-action"
                        onClick={() => {
                          onNavModuleSelect('bandeja');
                          setAcknowledgedInboxCount(pendingInboxCount);
                          setIsNotificationPanelOpen(false);
                        }}
                      >
                        Ir a bandeja
                      </button>
                    </div>
                  </div>
                )}
                {!hasSystemNotifications && (
                  <p className="topbar-notification-empty">No hay notificaciones.</p>
                )}
                {formNotifications.map((item) => (
                  <div key={item.id} className={`topbar-notification-item ${item.type}`}>
                    <p>{item.text}</p>
                    <div className="topbar-notification-actions">
                      <button
                        type="button"
                        className="topbar-notification-dismiss"
                        onClick={() => removeFormNotification(item.id)}
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        <div key={moduleTransitionKey} className="module-switch-stage">
          {renderModule()}
        </div>

        {!isAdmin && (
          <nav className="employee-bottom-nav" aria-label="Navegacion inferior empleado">
            {mobileEmployeeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`employee-bottom-link${activeModule === tab.key ? ' active' : ''}`}
                onClick={() => onNavModuleSelect(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {finalizeModal.open && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Justificacion de demora">
            <div className="modal-card">
              <h3>Justificacion obligatoria</h3>
              <p>
                El tiempo real supera al estimado ({formatMinutes(finalizeModal.tiempoRealEfectivo)} vs {formatMinutes(finalizeModal.tiempoEstimado)}).
                Debes explicar la demora para cerrar el trabajo.
              </p>
              <textarea
                value={finalizeModal.notas}
                onChange={(event) => setFinalizeModal((prev) => ({ ...prev, notas: event.target.value }))}
                placeholder="Describe por que se ha excedido el tiempo estimado"
                rows={4}
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="solid-btn"
                  onClick={() => onFinalizarTrabajo(finalizeModal.trabajo, finalizeModal.notas)}
                  disabled={!finalizeModal.notas.trim() || isUpdatingTrabajo}
                >
                  {isUpdatingTrabajo ? 'Guardando...' : 'Guardar y finalizar'}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setFinalizeModal({
                    open: false,
                    trabajo: null,
                    tiempoEstimado: 0,
                    tiempoRealEfectivo: 0,
                    notas: '',
                  })}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {editRetrasoModal.open && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Ajustar trabajo realizado">
            <div className="modal-card">
              <h3>Ajustar trabajo realizado</h3>
              <p>{editRetrasoModal.cliente} Â· {editRetrasoModal.empleado}</p>

              <div className="profile-grid">
                <label className="form-field">
                  <span>Tiempo estimado (min)</span>
                  <input
                    type="number"
                    value={editRetrasoModal.tiempo_estimado}
                    onChange={(event) => setEditRetrasoModal((prev) => ({ ...prev, tiempo_estimado: event.target.value }))}
                    min="1"
                  />
                </label>
                <label className="form-field">
                  <span>Tiempo real (min)</span>
                  <input
                    type="number"
                    value={editRetrasoModal.tiempo_real_efectivo}
                    onChange={(event) => setEditRetrasoModal((prev) => ({ ...prev, tiempo_real_efectivo: event.target.value }))}
                    min="1"
                  />
                </label>
              </div>

              <label className="form-field">
                <span>Notas del trabajo</span>
                <textarea
                  value={editRetrasoModal.notas_empleado}
                  onChange={(event) => setEditRetrasoModal((prev) => ({ ...prev, notas_empleado: event.target.value }))}
                  rows={4}
                  placeholder="Notas o detalle operativo del trabajo"
                />
              </label>

              <label className="form-field">
                <span>Motivo del ajuste (auditoria)</span>
                <textarea
                  value={editRetrasoModal.motivo_ajuste}
                  onChange={(event) => setEditRetrasoModal((prev) => ({ ...prev, motivo_ajuste: event.target.value }))}
                  rows={3}
                  placeholder="Explica por que realizas este ajuste"
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="solid-btn"
                  onClick={onSaveEditRetraso}
                  disabled={isSavingRetrasoEdit}
                >
                  {isSavingRetrasoEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={onCloseEditRetraso}
                  disabled={isSavingRetrasoEdit}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-notifications" aria-live="polite">
          {isLoading && <div className="toast-card info">Cargando informacion...</div>}
          {isSavingSchedule && <div className="toast-card info">Guardando cambios en agenda...</div>}
          {errorMessage && (
            <div className="toast-card error">
              <span>{errorMessage}</span>
              <button type="button" className="toast-close" onClick={() => setErrorMessage('')}>x</button>
            </div>
          )}
          {successMessage && (
            <div className="toast-card success">
              <span>{successMessage}</span>
              <button type="button" className="toast-close" onClick={() => setSuccessMessage('')}>x</button>
            </div>
          )}
          {undoAction && (
            <div className="toast-card warning">
              <span>Servicio movido a pendientes.</span>
              <div className="toast-actions">
                <button type="button" className="undo-btn" onClick={onUndoPending}>Deshacer</button>
                <button type="button" className="toast-close" onClick={() => setUndoAction(null)}>x</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}