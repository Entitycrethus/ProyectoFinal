/**
 * Módulo de Base de Datos Local (LocalStorage + IndexedDB Mirror)
 * Sistema de Gestión Escolar - Institución Educativa
 */

const DB_STORAGE_KEY = 'ie_sistema_estudiantes_v1';
const DB_COUNTER_KEY = 'ie_sistema_correlativo_v1';
const IDB_NAME = 'InstitucionEducativaDB';
const IDB_VERSION = 1;
const IDB_STORE = 'estudiantes';

// Datos iniciales de demostración para que el administrativo pueda probar el sistema de inmediato
const DATOS_SEMILLA = [
    {
        id: 'est-seed-1',
        codigo: 'EST-2026-0001',
        dni: '74859612',
        nombres: 'Mateo Alejandro',
        apellidos: 'Quispe Mendoza',
        nivel: 'Primaria',
        grado: 4,
        seccion: 'A',
        correoEstudiante: 'mateo.quispe@colegio.edu.pe',
        telefonoEstudiante: '987654321',
        parentescoApoderado: 'Madre',
        nombresApoderado: 'Carmen Rosa',
        apellidosApoderado: 'Mendoza Salazar',
        telefonoApoderado: '987112233',
        correoApoderado: 'carmen.mendoza@gmail.com',
        estado: 'Activo',
        observaciones: 'Entrega de documentación completa.',
        fechaRegistro: '2026-03-02T08:30:00.000Z',
        fechaActualizacion: '2026-03-02T08:30:00.000Z'
    },
    {
        id: 'est-seed-2',
        codigo: 'EST-2026-0002',
        dni: '75963214',
        nombres: 'Valentina Sofía',
        apellidos: 'Rojas Huamán',
        nivel: 'Secundaria',
        grado: 3,
        seccion: 'B',
        correoEstudiante: 'valentina.rojas@colegio.edu.pe',
        telefonoEstudiante: '912345678',
        parentescoApoderado: 'Padre',
        nombresApoderado: 'Jorge Luis',
        apellidosApoderado: 'Rojas Paredes',
        telefonoApoderado: '945678123',
        correoApoderado: 'jrojas.paredes@hotmail.com',
        estado: 'Activo',
        observaciones: 'Delegada de aula.',
        fechaRegistro: '2026-03-03T09:15:00.000Z',
        fechaActualizacion: '2026-03-03T09:15:00.000Z'
    },
    {
        id: 'est-seed-3',
        codigo: 'EST-2026-0003',
        dni: '76123489',
        nombres: 'Sebastián Gabriel',
        apellidos: 'Vargas Castillo',
        nivel: 'Secundaria',
        grado: 5,
        seccion: 'A',
        correoEstudiante: 'sebastian.vargas@colegio.edu.pe',
        telefonoEstudiante: '934567891',
        parentescoApoderado: 'Apoderado / Tutor',
        nombresApoderado: 'María Elena',
        apellidosApoderado: 'Castillo Vega',
        telefonoApoderado: '998877665',
        correoApoderado: 'mcastillo.vega@gmail.com',
        estado: 'Activo',
        observaciones: 'Pertenece al club de ciencias.',
        fechaRegistro: '2026-03-04T10:40:00.000Z',
        fechaActualizacion: '2026-03-04T10:40:00.000Z'
    },
    {
        id: 'est-seed-4',
        codigo: 'EST-2026-0004',
        dni: '78451236',
        nombres: 'Luciana Camila',
        apellidos: 'Flores Gutiérrez',
        nivel: 'Primaria',
        grado: 1,
        seccion: 'B',
        correoEstudiante: 'luciana.flores@colegio.edu.pe',
        telefonoEstudiante: '965432187',
        parentescoApoderado: 'Madre',
        nombresApoderado: 'Patricia Paola',
        apellidosApoderado: 'Gutiérrez Ramos',
        telefonoApoderado: '954321987',
        correoApoderado: 'patricia.gutierrez@gmail.com',
        estado: 'Activo',
        observaciones: 'Nuevo ingreso 2026.',
        fechaRegistro: '2026-03-05T11:20:00.000Z',
        fechaActualizacion: '2026-03-05T11:20:00.000Z'
    },
    {
        id: 'est-seed-5',
        codigo: 'EST-2026-0005',
        dni: '79321654',
        nombres: 'Diego Alonso',
        apellidos: 'Paredes Torres',
        nivel: 'Primaria',
        grado: 6,
        seccion: 'C',
        correoEstudiante: 'diego.paredes@colegio.edu.pe',
        telefonoEstudiante: '923456789',
        parentescoApoderado: 'Padre',
        nombresApoderado: 'Carlos Alberto',
        apellidosApoderado: 'Paredes Silva',
        telefonoApoderado: '976543210',
        correoApoderado: 'cparedes.silva@yahoo.com',
        estado: 'Activo',
        observaciones: 'Beca deportiva escolar.',
        fechaRegistro: '2026-03-06T14:10:00.000Z',
        fechaActualizacion: '2026-03-06T14:10:00.000Z'
    }
];

class BaseDatosEscolar {
    constructor() {
        this.estudiantes = [];
        this.correlativo = 5;
        this.inicializar();
    }

    inicializar() {
        try {
            const guardado = localStorage.getItem(DB_STORAGE_KEY);
            const corrGuardado = localStorage.getItem(DB_COUNTER_KEY);

            if (guardado) {
                this.estudiantes = JSON.parse(guardado);
                this.correlativo = corrGuardado ? parseInt(corrGuardado, 10) : this.calcularMaximoCorrelativo();
            } else {
                this.estudiantes = [...DATOS_SEMILLA];
                this.correlativo = 5;
                this.persistir();
            }
        } catch (err) {
            console.error('Error al leer localStorage:', err);
            this.estudiantes = [...DATOS_SEMILLA];
            this.correlativo = 5;
        }
        this.sincronizarIndexedDB();
    }

    calcularMaximoCorrelativo() {
        let max = 0;
        for (const est of this.estudiantes) {
            if (est.codigo) {
                const partes = est.codigo.split('-');
                const num = parseInt(partes[partes.length - 1], 10);
                if (!isNaN(num) && num > max) {
                    max = num;
                }
            }
        }
        return max;
    }

    persistir() {
        try {
            localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.estudiantes));
            localStorage.setItem(DB_COUNTER_KEY, String(this.correlativo));
            this.sincronizarIndexedDB();
        } catch (err) {
            console.error('Error al guardar en localStorage:', err);
        }
    }

    sincronizarIndexedDB() {
        if (!window.indexedDB) return;
        try {
            const request = indexedDB.open(IDB_NAME, IDB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(IDB_STORE)) {
                    db.createObjectStore(IDB_STORE, { keyPath: 'codigo' });
                }
            };
            request.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(IDB_STORE, 'readwrite');
                const store = tx.objectStore(IDB_STORE);
                store.clear();
                for (const est of this.estudiantes) {
                    store.put(est);
                }
            };
        } catch (e) {
            // IndexedDB puede estar restringido en algunos entornos, localStorage sigue activo
        }
    }

    /**
     * Genera el próximo código único de estudiante (ej: EST-2026-0006)
     * sin incrementar todavía el contador (para previsualización)
     */
    previsualizarSiguienteCodigo() {
        const anio = new Date().getFullYear();
        let siguiente = Math.max(this.correlativo, this.calcularMaximoCorrelativo()) + 1;
        let candidato = `EST-${anio}-${String(siguiente).padStart(4, '0')}`;
        while (this.buscarPorCodigo(candidato)) {
            siguiente++;
            candidato = `EST-${anio}-${String(siguiente).padStart(4, '0')}`;
        }
        return { codigo: candidato, numero: siguiente };
    }

    obtenerTodos() {
        return [...this.estudiantes];
    }

    buscarPorCodigo(codigo) {
        if (!codigo) return null;
        const limpio = codigo.trim().toUpperCase();
        return this.estudiantes.find(e => e.codigo.toUpperCase() === limpio) || null;
    }

    buscarPorDNI(dni) {
        if (!dni) return null;
        const limpio = dni.trim();
        return this.estudiantes.find(e => e.dni === limpio) || null;
    }

    /**
     * Registra un nuevo estudiante asignándole un código único automático
     */
    registrarEstudiante(datos) {
        const { codigo, numero } = this.previsualizarSiguienteCodigo();
        const ahora = new Date().toISOString();

        const nuevoEstudiante = {
            id: 'est-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            codigo: codigo,
            dni: (datos.dni || '').trim(),
            nombres: this.formatearNombrePropio(datos.nombres),
            apellidos: this.formatearNombrePropio(datos.apellidos),
            nivel: datos.nivel === 'Secundaria' ? 'Secundaria' : 'Primaria',
            grado: parseInt(datos.grado, 10),
            seccion: (datos.seccion || 'A').trim().toUpperCase(),
            correoEstudiante: (datos.correoEstudiante || '').trim().toLowerCase(),
            telefonoEstudiante: (datos.telefonoEstudiante || '').trim(),
            parentescoApoderado: datos.parentescoApoderado || 'Apoderado / Tutor',
            nombresApoderado: this.formatearNombrePropio(datos.nombresApoderado),
            apellidosApoderado: this.formatearNombrePropio(datos.apellidosApoderado),
            telefonoApoderado: (datos.telefonoApoderado || '').trim(),
            correoApoderado: (datos.correoApoderado || '').trim().toLowerCase(),
            estado: datos.estado || 'Activo',
            observaciones: (datos.observaciones || '').trim(),
            fechaRegistro: ahora,
            fechaActualizacion: ahora
        };

        this.estudiantes.unshift(nuevoEstudiante);
        this.correlativo = numero;
        this.persistir();
        return nuevoEstudiante;
    }

    /**
     * Actualiza o corrige los datos de un estudiante existente por su código
     */
    actualizarEstudiante(codigoOriginal, datosActualizados) {
        const indice = this.estudiantes.findIndex(
            e => e.codigo.toUpperCase() === codigoOriginal.trim().toUpperCase()
        );
        if (indice === -1) {
            throw new Error('No se encontró al estudiante con el código indicado.');
        }

        const actual = this.estudiantes[indice];

        // Verificar que si cambia el DNI, no pertenezca a otro estudiante
        if (datosActualizados.dni && datosActualizados.dni.trim() !== actual.dni) {
            const duplicadoDni = this.estudiantes.find(
                (e, idx) => idx !== indice && e.dni && e.dni === datosActualizados.dni.trim()
            );
            if (duplicadoDni) {
                throw new Error(`El DNI ${datosActualizados.dni} ya está registrado en el estudiante ${duplicadoDni.codigo}.`);
            }
        }

        const actualizado = {
            ...actual,
            dni: datosActualizados.dni !== undefined ? datosActualizados.dni.trim() : actual.dni,
            nombres: datosActualizados.nombres ? this.formatearNombrePropio(datosActualizados.nombres) : actual.nombres,
            apellidos: datosActualizados.apellidos ? this.formatearNombrePropio(datosActualizados.apellidos) : actual.apellidos,
            nivel: datosActualizados.nivel || actual.nivel,
            grado: datosActualizados.grado !== undefined ? parseInt(datosActualizados.grado, 10) : actual.grado,
            seccion: datosActualizados.seccion ? datosActualizados.seccion.trim().toUpperCase() : actual.seccion,
            correoEstudiante: datosActualizados.correoEstudiante !== undefined
                ? datosActualizados.correoEstudiante.trim().toLowerCase()
                : actual.correoEstudiante,
            telefonoEstudiante: datosActualizados.telefonoEstudiante !== undefined
                ? datosActualizados.telefonoEstudiante.trim()
                : actual.telefonoEstudiante,
            parentescoApoderado: datosActualizados.parentescoApoderado || actual.parentescoApoderado,
            nombresApoderado: datosActualizados.nombresApoderado
                ? this.formatearNombrePropio(datosActualizados.nombresApoderado)
                : actual.nombresApoderado,
            apellidosApoderado: datosActualizados.apellidosApoderado
                ? this.formatearNombrePropio(datosActualizados.apellidosApoderado)
                : actual.apellidosApoderado,
            telefonoApoderado: datosActualizados.telefonoApoderado !== undefined
                ? datosActualizados.telefonoApoderado.trim()
                : actual.telefonoApoderado,
            correoApoderado: datosActualizados.correoApoderado !== undefined
                ? datosActualizados.correoApoderado.trim().toLowerCase()
                : actual.correoApoderado,
            estado: datosActualizados.estado || actual.estado,
            observaciones: datosActualizados.observaciones !== undefined
                ? datosActualizados.observaciones.trim()
                : actual.observaciones,
            fechaActualizacion: new Date().toISOString()
        };

        this.estudiantes[indice] = actualizado;
        this.persistir();
        return actualizado;
    }

    eliminarEstudiante(codigo) {
        const limpio = codigo.trim().toUpperCase();
        const inicial = this.estudiantes.length;
        this.estudiantes = this.estudiantes.filter(e => e.codigo.toUpperCase() !== limpio);
        if (this.estudiantes.length !== inicial) {
            this.persistir();
            return true;
        }
        return false;
    }

    restaurarSemilla() {
        this.estudiantes = [...DATOS_SEMILLA];
        this.correlativo = 5;
        this.persistir();
        return this.estudiantes;
    }

    vaciarBaseDeDatos() {
        this.estudiantes = [];
        this.correlativo = 0;
        this.persistir();
    }

    importarRegistros(listaNuevos, modo = 'combinar') {
        if (modo === 'reemplazar') {
            this.estudiantes = [];
            this.correlativo = 0;
        }

        let insertados = 0;
        let actualizados = 0;

        for (const item of listaNuevos) {
            if (!item.nombres || !item.apellidos) continue;

            const existente = item.codigo
                ? this.buscarPorCodigo(item.codigo)
                : (item.dni ? this.buscarPorDNI(item.dni) : null);

            if (existente) {
                this.actualizarEstudiante(existente.codigo, item);
                actualizados++;
            } else {
                const { codigo, numero } = item.codigo && !this.buscarPorCodigo(item.codigo)
                    ? { codigo: item.codigo.toUpperCase(), numero: Math.max(this.correlativo, this.calcularMaximoCorrelativo() + 1) }
                    : this.previsualizarSiguienteCodigo();

                const ahora = new Date().toISOString();
                this.estudiantes.push({
                    id: 'est-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
                    codigo,
                    dni: (item.dni || '').trim(),
                    nombres: this.formatearNombrePropio(item.nombres),
                    apellidos: this.formatearNombrePropio(item.apellidos),
                    nivel: item.nivel === 'Secundaria' ? 'Secundaria' : 'Primaria',
                    grado: parseInt(item.grado, 10) || 1,
                    seccion: (item.seccion || 'A').trim().toUpperCase(),
                    correoEstudiante: (item.correoEstudiante || '').trim().toLowerCase(),
                    telefonoEstudiante: (item.telefonoEstudiante || '').trim(),
                    parentescoApoderado: item.parentescoApoderado || 'Apoderado / Tutor',
                    nombresApoderado: this.formatearNombrePropio(item.nombresApoderado || 'Por actualizar'),
                    apellidosApoderado: this.formatearNombrePropio(item.apellidosApoderado || 'Por actualizar'),
                    telefonoApoderado: (item.telefonoApoderado || item.contacto || '').trim(),
                    correoApoderado: (item.correoApoderado || '').trim().toLowerCase(),
                    estado: item.estado || 'Activo',
                    observaciones: (item.observaciones || '').trim(),
                    fechaRegistro: item.fechaRegistro || ahora,
                    fechaActualizacion: ahora
                });
                this.correlativo = Math.max(this.correlativo, numero, this.calcularMaximoCorrelativo());
                insertados++;
            }
        }

        this.persistir();
        return { insertados, actualizados, total: this.estudiantes.length };
    }

    formatearNombrePropio(texto) {
        if (!texto) return '';
        return texto
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
            .join(' ');
    }
}

/**
 * Reglas de validación alineadas con la lógica institucional
 */
const ValidadorEscolar = {
    esNombreValido(texto) {
        if (!texto || texto.trim().length < 2) return false;
        return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/.test(texto.trim());
    },

    esDNIValido(dni) {
        if (!dni || dni.trim() === '') return true; // Opcional si no se ingresa, pero si se ingresa debe tener 8 dígitos
        return /^\d{8}$/.test(dni.trim());
    },

    esTelefonoValido(tel) {
        if (!tel || tel.trim() === '') return false;
        const limpio = tel.replace(/[\s-]/g, '');
        return /^\d{9}$/.test(limpio);
    },

    esCorreoValido(correo) {
        if (!correo || correo.trim() === '') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
    },

    obtenerGradosPorNivel(nivel) {
        return nivel === 'Primaria' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
    },

    obtenerSeccionesPorNivel(nivel) {
        return nivel === 'Primaria' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
    }
};

window.dbEscolar = new BaseDatosEscolar();
window.ValidadorEscolar = ValidadorEscolar;
