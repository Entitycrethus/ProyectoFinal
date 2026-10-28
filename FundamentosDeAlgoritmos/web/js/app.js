/**
 * Controlador Principal de Interfaz Administrativa
 * SGE - Sistema de Gestión Escolar
 */

document.addEventListener('DOMContentLoaded', () => {
    const db = window.dbEscolar;
    const validador = window.ValidadorEscolar;
    const excel = window.ExcelServicio;

    let estudianteSeleccionadoEdicion = null;
    let estudianteActualModal = null;

    // Configuración de títulos por cada subapartado
    const TITULOS_MODULOS = {
        dashboard: {
            titulo: 'Panel Principal Administrativo',
            subtitulo: 'Resumen general del padrón de estudiantes y accesos directos'
        },
        registrar: {
            titulo: 'Registrar Nuevo Estudiante',
            subtitulo: 'Ficha de matrícula con generación automática de código único estudiantil'
        },
        buscar: {
            titulo: 'Directorio y Búsqueda de Estudiantes',
            subtitulo: 'Consulte y filtre alumnos por código único, nombres, nivel, grado, sección o apoderado'
        },
        corregir: {
            titulo: 'Corregir o Actualizar Datos de Estudiante',
            subtitulo: 'Seleccione a un alumno para rectificar sus datos personales, aula o información del apoderado'
        },
        basedatos: {
            titulo: 'Base de Datos y Exportación a Excel',
            subtitulo: 'Descargue el padrón en formato oficial Microsoft Excel (.xlsx) o gestione respaldos CSV'
        }
    };

    // =========================================================================
    // 1. NAVEGACIÓN ENTRE SUBAPARTADOS
    // =========================================================================
    function cambiarSubapartado(tabId, codigoPreseleccionado = null) {
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tabId}`);
        });

        const info = TITULOS_MODULOS[tabId] || TITULOS_MODULOS.dashboard;
        document.getElementById('pageTitle').textContent = info.titulo;
        document.getElementById('pageSubtitle').textContent = info.subtitulo;

        // Cerrar menú móvil si estaba abierto
        document.getElementById('sidebar').classList.remove('open');

        // Refrescar vistas según el subapartado activo
        actualizarIndicadoresGlobales();
        if (tabId === 'dashboard') renderizarDashboard();
        if (tabId === 'registrar') actualizarPrevisualizacionCodigo();
        if (tabId === 'buscar') renderizarTablaBusqueda();
        if (tabId === 'corregir') {
            renderizarListaSelectorEdicion();
            if (codigoPreseleccionado) {
                cargarEstudianteEnEditor(codigoPreseleccionado);
            }
        }
    }

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => cambiarSubapartado(btn.dataset.tab));
    });

    document.querySelectorAll('[data-goto]').forEach(btn => {
        btn.addEventListener('click', () => cambiarSubapartado(btn.dataset.goto));
    });

    document.getElementById('btnQuickRegister').addEventListener('click', () => {
        cambiarSubapartado('registrar');
    });

    document.getElementById('btnToggleMenu').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // =========================================================================
    // 2. SELECTORES DINÁMICOS DE NIVEL, GRADO Y SECCIÓN
    // =========================================================================
    function poblarGradosYSecciones(selectNivel, selectGrado, selectSeccion, gradoHint = null, seccionHint = null) {
        const nivel = selectNivel.value;
        const grados = validador.obtenerGradosPorNivel(nivel);
        const secciones = validador.obtenerSeccionesPorNivel(nivel);

        const valorGradoPrevio = selectGrado.value;
        const valorSeccionPrevia = selectSeccion.value;

        selectGrado.innerHTML = grados
            .map(g => `<option value="${g}">${g}° Grado de ${nivel}</option>`)
            .join('');

        selectSeccion.innerHTML = secciones
            .map(s => `<option value="${s}">Sección "${s}"</option>`)
            .join('');

        if (grados.includes(Number(valorGradoPrevio))) {
            selectGrado.value = valorGradoPrevio;
        }
        if (secciones.includes(valorSeccionPrevia)) {
            selectSeccion.value = valorSeccionPrevia;
        }

        if (gradoHint) {
            gradoHint.textContent = nivel === 'Primaria'
                ? 'En Primaria disponible de 1° a 6° grado.'
                : 'En Secundaria disponible de 1° a 5° grado.';
        }
        if (seccionHint) {
            seccionHint.textContent = nivel === 'Primaria'
                ? 'En Primaria secciones habilitadas: A, B y C.'
                : 'En Secundaria secciones habilitadas: A, B, C y D.';
        }
    }

    const regNivel = document.getElementById('regNivel');
    const regGrado = document.getElementById('regGrado');
    const regSeccion = document.getElementById('regSeccion');
    const regGradoHint = document.getElementById('regGradoHint');
    const regSeccionHint = document.getElementById('regSeccionHint');

    regNivel.addEventListener('change', () => {
        poblarGradosYSecciones(regNivel, regGrado, regSeccion, regGradoHint, regSeccionHint);
    });

    const editNivel = document.getElementById('editNivel');
    const editGrado = document.getElementById('editGrado');
    const editSeccion = document.getElementById('editSeccion');

    editNivel.addEventListener('change', () => {
        poblarGradosYSecciones(editNivel, editGrado, editSeccion);
    });

    // Inicializar selectores del formulario de registro
    poblarGradosYSecciones(regNivel, regGrado, regSeccion, regGradoHint, regSeccionHint);
    poblarGradosYSecciones(editNivel, editGrado, editSeccion);

    // =========================================================================
    // 3. INDICADORES Y PANEL PRINCIPAL (DASHBOARD)
    // =========================================================================
    function actualizarIndicadoresGlobales() {
        const todos = db.obtenerTodos();
        const { codigo } = db.previsualizarSiguienteCodigo();

        document.getElementById('navTotalBadge').textContent = todos.length;
        document.getElementById('headerNextCode').textContent = codigo;
        document.getElementById('formPreviewCode').textContent = codigo;
    }

    function actualizarPrevisualizacionCodigo() {
        const { codigo } = db.previsualizarSiguienteCodigo();
        document.getElementById('formPreviewCode').textContent = codigo;
        document.getElementById('headerNextCode').textContent = codigo;
    }

    function renderizarDashboard() {
        const todos = db.obtenerTodos();
        const primaria = todos.filter(e => e.nivel === 'Primaria');
        const secundaria = todos.filter(e => e.nivel === 'Secundaria');

        const aulasSet = new Set(todos.map(e => `${e.nivel}-${e.grado}-${e.seccion}`));

        document.getElementById('statTotal').textContent = todos.length;
        document.getElementById('statPrimaria').textContent = primaria.length;
        document.getElementById('statSecundaria').textContent = secundaria.length;
        document.getElementById('statAulas').textContent = aulasSet.size;

        // Renderizar últimos 5 estudiantes registrados
        const tbody = document.getElementById('dashboardRecentBody');
        const recientes = todos.slice(0, 5);

        if (recientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color:#64748b;">No hay estudiantes registrados todavía.</td></tr>`;
        } else {
            tbody.innerHTML = recientes.map(e => `
                <tr>
                    <td><span class="code-chip">${escaparHtml(e.codigo)}</span></td>
                    <td>
                        <strong>${escaparHtml(e.apellidos)}, ${escaparHtml(e.nombres)}</strong>
                        <div style="font-size:0.78rem; color:#64748b;">${escaparHtml(e.correoEstudiante || 'Sin correo')}</div>
                    </td>
                    <td>
                        <span class="level-badge ${e.nivel === 'Primaria' ? 'level-primaria' : 'level-secundaria'}">
                            ${escaparHtml(e.nivel)} - ${e.grado}° "${escaparHtml(e.seccion)}"
                        </span>
                    </td>
                    <td>
                        <strong>${escaparHtml(e.nombresApoderado)} ${escaparHtml(e.apellidosApoderado)}</strong>
                        <div style="font-size:0.76rem; color:#64748b;">${escaparHtml(e.parentescoApoderado || 'Apoderado')}</div>
                    </td>
                    <td>
                        <div style="font-size:0.8rem;"><strong>Est:</strong> ${escaparHtml(e.telefonoEstudiante || '-')}</div>
                        <div style="font-size:0.8rem; color:#0f172a;"><strong>Apo:</strong> ${escaparHtml(e.telefonoApoderado || '-')}</div>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button type="button" class="btn btn-outline btn-sm" data-ver-ficha="${escaparHtml(e.codigo)}">Ficha</button>
                            <button type="button" class="btn btn-primary btn-sm" data-ir-corregir="${escaparHtml(e.codigo)}">Corregir</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Renderizar barras de distribución por nivel y grado
        const total = Math.max(todos.length, 1);
        const contPrimaria = [1, 2, 3, 4, 5, 6].map(g => ({
            grado: `${g}° Primaria`,
            cantidad: primaria.filter(e => Number(e.grado) === g).length
        }));
        const contSecundaria = [1, 2, 3, 4, 5].map(g => ({
            grado: `${g}° Secund.`,
            cantidad: secundaria.filter(e => Number(e.grado) === g).length
        }));

        const distContainer = document.getElementById('levelDistributionContainer');
        distContainer.innerHTML = `
            <div class="dist-group">
                <h4>Nivel Primaria (${primaria.length} alumnos)</h4>
                <div class="dist-bars">
                    ${contPrimaria.map(item => `
                        <div class="dist-row">
                            <span class="dist-label">${item.grado}</span>
                            <div class="dist-track">
                                <div class="dist-fill primaria" style="width: ${Math.round((item.cantidad / total) * 100)}%"></div>
                            </div>
                            <span class="dist-count">${item.cantidad}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="dist-group">
                <h4>Nivel Secundaria (${secundaria.length} alumnos)</h4>
                <div class="dist-bars">
                    ${contSecundaria.map(item => `
                        <div class="dist-row">
                            <span class="dist-label">${item.grado}</span>
                            <div class="dist-track">
                                <div class="dist-fill secundaria" style="width: ${Math.round((item.cantidad / total) * 100)}%"></div>
                            </div>
                            <span class="dist-count">${item.cantidad}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 4. REGISTRO DE ESTUDIANTE Y VALIDACIÓN AMIGABLE
    // =========================================================================
    const formRegistro = document.getElementById('formRegistroEstudiante');

    function validarDatosFormulario(datos, prefijoInput, codigoExcluido = null) {
        limpiarErroresInputs(prefijoInput);

        if (!validador.esNombreValido(datos.nombres)) {
            marcarErrorInput(`${prefijoInput}Nombres`, 'Ingrese los nombres válidos del estudiante (solo letras y espacios).');
            return false;
        }
        if (!validador.esNombreValido(datos.apellidos)) {
            marcarErrorInput(`${prefijoInput}Apellidos`, 'Ingrese los apellidos válidos del estudiante (solo letras y espacios).');
            return false;
        }
        if (datos.dni && !validador.esDNIValido(datos.dni)) {
            marcarErrorInput(`${prefijoInput}Dni`, 'El DNI debe contener exactamente 8 dígitos numéricos.');
            return false;
        }
        if (datos.dni) {
            const existenteDni = db.buscarPorDNI(datos.dni);
            if (existenteDni && existenteDni.codigo !== codigoExcluido) {
                marcarErrorInput(`${prefijoInput}Dni`, `El DNI ${datos.dni} ya pertenece al estudiante ${existenteDni.codigo}.`);
                return false;
            }
        }
        if (!validador.esCorreoValido(datos.correoEstudiante)) {
            marcarErrorInput(`${prefijoInput}CorreoEst`, 'Ingrese un correo electrónico válido para el estudiante.');
            return false;
        }
        if (!validador.esTelefonoValido(datos.telefonoEstudiante)) {
            marcarErrorInput(`${prefijoInput}TelefonoEst`, 'El teléfono del estudiante debe tener 9 dígitos numéricos.');
            return false;
        }
        if (!validador.esNombreValido(datos.nombresApoderado)) {
            marcarErrorInput(`${prefijoInput}NombresApo`, 'Ingrese los nombres del padre, madre o apoderado.');
            return false;
        }
        if (!validador.esNombreValido(datos.apellidosApoderado)) {
            marcarErrorInput(`${prefijoInput}ApellidosApo`, 'Ingrese los apellidos del padre, madre o apoderado.');
            return false;
        }
        if (!validador.esTelefonoValido(datos.telefonoApoderado)) {
            marcarErrorInput(`${prefijoInput}TelefonoApo`, 'El teléfono del apoderado debe tener 9 dígitos numéricos.');
            return false;
        }
        if (datos.correoApoderado && !validador.esCorreoValido(datos.correoApoderado)) {
            marcarErrorInput(`${prefijoInput}CorreoApo`, 'El correo electrónico del apoderado no tiene un formato válido.');
            return false;
        }

        return true;
    }

    function marcarErrorInput(idInput, mensaje) {
        const el = document.getElementById(idInput);
        if (el) {
            el.classList.add('input-error');
            el.focus();
        }
        mostrarNotificacion(mensaje, 'error');
    }

    function limpiarErroresInputs(prefijo) {
        document.querySelectorAll(`[id^="${prefijo}"]`).forEach(el => {
            el.classList.remove('input-error');
        });
    }

    formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();

        const datos = {
            nombres: document.getElementById('regNombres').value,
            apellidos: document.getElementById('regApellidos').value,
            dni: document.getElementById('regDni').value,
            correoEstudiante: document.getElementById('regCorreoEst').value,
            telefonoEstudiante: document.getElementById('regTelefonoEst').value,
            nivel: document.getElementById('regNivel').value,
            grado: document.getElementById('regGrado').value,
            seccion: document.getElementById('regSeccion').value,
            parentescoApoderado: document.getElementById('regParentesco').value,
            nombresApoderado: document.getElementById('regNombresApo').value,
            apellidosApoderado: document.getElementById('regApellidosApo').value,
            telefonoApoderado: document.getElementById('regTelefonoApo').value,
            correoApoderado: document.getElementById('regCorreoApo').value,
            observaciones: document.getElementById('regObservaciones').value
        };

        if (!validarDatosFormulario(datos, 'reg')) return;

        const creado = db.registrarEstudiante(datos);
        formRegistro.reset();
        poblarGradosYSecciones(regNivel, regGrado, regSeccion, regGradoHint, regSeccionHint);
        actualizarIndicadoresGlobales();

        mostrarNotificacion(`Estudiante registrado exitosamente con Código Único: ${creado.codigo}`, 'success');
        abrirModalFichaEstudiante(creado.codigo, true);
    });

    document.getElementById('btnLimpiarRegistro').addEventListener('click', () => {
        limpiarErroresInputs('reg');
        setTimeout(() => {
            poblarGradosYSecciones(regNivel, regGrado, regSeccion, regGradoHint, regSeccionHint);
            actualizarPrevisualizacionCodigo();
        }, 10);
    });

    // =========================================================================
    // 5. BÚSQUEDA Y FILTRADO AVANZADO
    // =========================================================================
    function obtenerEstudiantesFiltrados() {
        const query = document.getElementById('searchQuery').value.trim().toLowerCase();
        const nivel = document.getElementById('filterNivel').value;
        const grado = document.getElementById('filterGrado').value;
        const seccion = document.getElementById('filterSeccion').value;
        const orden = document.getElementById('filterOrden').value;

        let lista = db.obtenerTodos().filter(e => {
            if (nivel !== 'TODOS' && e.nivel !== nivel) return false;
            if (grado !== 'TODOS' && String(e.grado) !== grado) return false;
            if (seccion !== 'TODOS' && e.seccion !== seccion) return false;

            if (query) {
                const textoBusqueda = [
                    e.codigo,
                    e.dni,
                    e.nombres,
                    e.apellidos,
                    `${e.nombres} ${e.apellidos}`,
                    `${e.apellidos} ${e.nombres}`,
                    e.correoEstudiante,
                    e.telefonoEstudiante,
                    e.nombresApoderado,
                    e.apellidosApoderado,
                    `${e.nombresApoderado} ${e.apellidosApoderado}`,
                    e.telefonoApoderado,
                    e.correoApoderado
                ].join(' ').toLowerCase();

                if (!textoBusqueda.includes(query)) return false;
            }
            return true;
        });

        // Aplicar ordenamiento
        if (orden === 'codigo') {
            lista.sort((a, b) => a.codigo.localeCompare(b.codigo));
        } else if (orden === 'apellidos') {
            lista.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
        } else if (orden === 'aula') {
            lista.sort((a, b) => {
                const cmpNivel = a.nivel.localeCompare(b.nivel);
                if (cmpNivel !== 0) return cmpNivel;
                if (a.grado !== b.grado) return a.grado - b.grado;
                return a.seccion.localeCompare(b.seccion);
            });
        }

        return lista;
    }

    function renderizarTablaBusqueda() {
        const filtrados = obtenerEstudiantesFiltrados();
        const total = db.obtenerTodos().length;
        const tbody = document.getElementById('searchTableBody');
        const counter = document.getElementById('searchResultsCounter');

        counter.textContent = `Mostrando ${filtrados.length} de ${total} estudiantes registrados`;

        if (filtrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; padding: 36px; color:#64748b;">
                        No se encontraron estudiantes con los criterios seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtrados.map(e => `
            <tr>
                <td><span class="code-chip">${escaparHtml(e.codigo)}</span></td>
                <td>${escaparHtml(e.dni || 'S/D')}</td>
                <td>
                    <strong>${escaparHtml(e.apellidos)}, ${escaparHtml(e.nombres)}</strong>
                    <div style="font-size:0.75rem; color:#64748b;">Estado: ${escaparHtml(e.estado || 'Activo')}</div>
                </td>
                <td>
                    <span class="level-badge ${e.nivel === 'Primaria' ? 'level-primaria' : 'level-secundaria'}">
                        ${escaparHtml(e.nivel)} - ${e.grado}° "${escaparHtml(e.seccion)}"
                    </span>
                </td>
                <td>
                    <div style="font-size:0.82rem;">📧 ${escaparHtml(e.correoEstudiante || '-')}</div>
                    <div style="font-size:0.82rem;">📱 ${escaparHtml(e.telefonoEstudiante || '-')}</div>
                </td>
                <td>
                    <strong>${escaparHtml(e.nombresApoderado)} ${escaparHtml(e.apellidosApoderado)}</strong>
                    <div style="font-size:0.76rem; color:#64748b;">Vínculo: ${escaparHtml(e.parentescoApoderado || 'Apoderado')}</div>
                </td>
                <td>
                    <strong>📱 ${escaparHtml(e.telefonoApoderado || '-')}</strong>
                    <div style="font-size:0.75rem; color:#64748b;">${escaparHtml(e.correoApoderado || '')}</div>
                </td>
                <td>
                    <div class="table-actions">
                        <button type="button" class="btn btn-outline btn-sm" data-ver-ficha="${escaparHtml(e.codigo)}">
                            Ver Ficha
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" data-ir-corregir="${escaparHtml(e.codigo)}">
                            Corregir Datos
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    ['searchQuery', 'filterNivel', 'filterGrado', 'filterSeccion', 'filterOrden'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', renderizarTablaBusqueda);
        el.addEventListener('change', renderizarTablaBusqueda);
    });

    document.getElementById('btnResetFilters').addEventListener('click', () => {
        document.getElementById('searchQuery').value = '';
        document.getElementById('filterNivel').value = 'TODOS';
        document.getElementById('filterGrado').value = 'TODOS';
        document.getElementById('filterSeccion').value = 'TODOS';
        document.getElementById('filterOrden').value = 'recientes';
        renderizarTablaBusqueda();
    });

    document.getElementById('btnExportFilteredExcel').addEventListener('click', () => {
        const filtrados = obtenerEstudiantesFiltrados();
        if (filtrados.length === 0) {
            mostrarNotificacion('No hay estudiantes en el filtro actual para exportar.', 'error');
            return;
        }
        excel.exportarExcelXLSX(filtrados, `Reporte_Filtrado_Estudiantes_IE.xlsx`);
        mostrarNotificacion(`Se exportaron ${filtrados.length} registros a Excel (.xlsx).`, 'success');
    });

    // =========================================================================
    // 6. SUBAPARTADO: CORREGIR / MODIFICAR DATOS DE ESTUDIANTE
    // =========================================================================
    const editSearchInput = document.getElementById('editSearchInput');
    const editStudentList = document.getElementById('editStudentList');
    const formCorregir = document.getElementById('formCorregirEstudiante');
    const editEmptyState = document.getElementById('editEmptyState');

    function renderizarListaSelectorEdicion() {
        const filtro = editSearchInput.value.trim().toLowerCase();
        const todos = db.obtenerTodos().filter(e => {
            if (!filtro) return true;
            return [
                e.codigo,
                e.dni,
                e.nombres,
                e.apellidos,
                `${e.nombres} ${e.apellidos}`,
                `${e.apellidos} ${e.nombres}`
            ].join(' ').toLowerCase().includes(filtro);
        });

        if (todos.length === 0) {
            editStudentList.innerHTML = `<div style="padding:18px; text-align:center; color:#64748b; font-size:0.85rem;">No se encontraron estudiantes con ese criterio.</div>`;
            return;
        }

        editStudentList.innerHTML = todos.map(e => {
            const activo = estudianteSeleccionadoEdicion === e.codigo ? 'selected' : '';
            return `
                <button type="button" class="selector-item ${activo}" data-select-edit="${escaparHtml(e.codigo)}">
                    <div class="selector-item-top">
                        <span class="code-chip">${escaparHtml(e.codigo)}</span>
                        <span class="level-badge ${e.nivel === 'Primaria' ? 'level-primaria' : 'level-secundaria'}">
                            ${e.nivel === 'Primaria' ? 'Prim.' : 'Sec.'} ${e.grado}° "${escaparHtml(e.seccion)}"
                        </span>
                    </div>
                    <strong>${escaparHtml(e.apellidos)}, ${escaparHtml(e.nombres)}</strong>
                    <small>Apoderado: ${escaparHtml(e.nombresApoderado)} ${escaparHtml(e.apellidosApoderado)} (${escaparHtml(e.telefonoApoderado)})</small>
                </button>
            `;
        }).join('');
    }

    editSearchInput.addEventListener('input', renderizarListaSelectorEdicion);

    editStudentList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-select-edit]');
        if (btn) {
            cargarEstudianteEnEditor(btn.dataset.selectEdit);
        }
    });

    function cargarEstudianteEnEditor(codigo) {
        const est = db.buscarPorCodigo(codigo);
        if (!est) return;

        estudianteSeleccionadoEdicion = est.codigo;
        limpiarErroresInputs('edit');

        editEmptyState.classList.add('hidden');
        formCorregir.classList.remove('hidden');

        document.getElementById('editCodigoOriginal').value = est.codigo;
        document.getElementById('editBannerCode').textContent = `CÓDIGO ÚNICO: ${est.codigo}`;
        document.getElementById('editBannerName').textContent = `${est.nombres} ${est.apellidos}`;
        const fechaMod = est.fechaActualizacion
            ? new Date(est.fechaActualizacion).toLocaleString('es-PE')
            : 'Sin modificaciones previas';
        document.getElementById('editBannerTimestamp').textContent = `Última actualización: ${fechaMod}`;

        document.getElementById('editNombres').value = est.nombres || '';
        document.getElementById('editApellidos').value = est.apellidos || '';
        document.getElementById('editDni').value = est.dni || '';
        document.getElementById('editCorreoEst').value = est.correoEstudiante || '';
        document.getElementById('editTelefonoEst').value = est.telefonoEstudiante || '';
        document.getElementById('editEstado').value = est.estado || 'Activo';

        editNivel.value = est.nivel || 'Primaria';
        poblarGradosYSecciones(editNivel, editGrado, editSeccion);
        editGrado.value = String(est.grado || 1);
        editSeccion.value = est.seccion || 'A';

        document.getElementById('editParentesco').value = est.parentescoApoderado || 'Apoderado / Tutor';
        document.getElementById('editNombresApo').value = est.nombresApoderado || '';
        document.getElementById('editApellidosApo').value = est.apellidosApoderado || '';
        document.getElementById('editTelefonoApo').value = est.telefonoApoderado || '';
        document.getElementById('editCorreoApo').value = est.correoApoderado || '';
        document.getElementById('editObservaciones').value = est.observaciones || '';

        renderizarListaSelectorEdicion();
    }

    formCorregir.addEventListener('submit', (e) => {
        e.preventDefault();
        const codigoOriginal = document.getElementById('editCodigoOriginal').value;
        if (!codigoOriginal) return;

        const datosActualizados = {
            nombres: document.getElementById('editNombres').value,
            apellidos: document.getElementById('editApellidos').value,
            dni: document.getElementById('editDni').value,
            correoEstudiante: document.getElementById('editCorreoEst').value,
            telefonoEstudiante: document.getElementById('editTelefonoEst').value,
            estado: document.getElementById('editEstado').value,
            nivel: document.getElementById('editNivel').value,
            grado: document.getElementById('editGrado').value,
            seccion: document.getElementById('editSeccion').value,
            parentescoApoderado: document.getElementById('editParentesco').value,
            nombresApoderado: document.getElementById('editNombresApo').value,
            apellidosApoderado: document.getElementById('editApellidosApo').value,
            telefonoApoderado: document.getElementById('editTelefonoApo').value,
            correoApoderado: document.getElementById('editCorreoApo').value,
            observaciones: document.getElementById('editObservaciones').value
        };

        if (!validarDatosFormulario(datosActualizados, 'edit', codigoOriginal)) return;

        try {
            const actualizado = db.actualizarEstudiante(codigoOriginal, datosActualizados);
            cargarEstudianteEnEditor(actualizado.codigo);
            actualizarIndicadoresGlobales();
            mostrarNotificacion(`Datos de ${actualizado.nombres} ${actualizado.apellidos} (${actualizado.codigo}) corregidos exitosamente.`, 'success');
        } catch (err) {
            mostrarNotificacion(err.message, 'error');
        }
    });

    document.getElementById('btnCancelEdit').addEventListener('click', () => {
        if (estudianteSeleccionadoEdicion) {
            cargarEstudianteEnEditor(estudianteSeleccionadoEdicion);
            mostrarNotificacion('Se restauraron los valores actuales del estudiante.', 'info');
        }
    });

    document.getElementById('btnViewCardFromEdit').addEventListener('click', () => {
        if (estudianteSeleccionadoEdicion) {
            abrirModalFichaEstudiante(estudianteSeleccionadoEdicion);
        }
    });

    document.getElementById('btnDeleteStudent').addEventListener('click', () => {
        if (!estudianteSeleccionadoEdicion) return;
        const est = db.buscarPorCodigo(estudianteSeleccionadoEdicion);
        if (!est) return;

        const confirmar = window.confirm(
            `¿Está seguro de eliminar el registro del estudiante ${est.nombres} ${est.apellidos} (${est.codigo})?\n\nEsta acción quitará al estudiante del padrón.`
        );
        if (confirmar) {
            db.eliminarEstudiante(est.codigo);
            estudianteSeleccionadoEdicion = null;
            formCorregir.classList.add('hidden');
            editEmptyState.classList.remove('hidden');
            renderizarListaSelectorEdicion();
            actualizarIndicadoresGlobales();
            mostrarNotificacion(`Registro ${est.codigo} eliminado correctamente.`, 'success');
        }
    });

    // =========================================================================
    // 7. MODAL DE FICHA DE MATRÍCULA E IMPRESIÓN
    // =========================================================================
    const studentModal = document.getElementById('studentModal');

    function abrirModalFichaEstudiante(codigo, recienRegistrado = false) {
        const est = db.buscarPorCodigo(codigo);
        if (!est) return;

        estudianteActualModal = est.codigo;
        document.getElementById('modalStudentTitle').textContent = recienRegistrado
            ? `¡Estudiante Registrado! Código: ${est.codigo}`
            : `Ficha de Estudiante: ${est.codigo}`;

        document.getElementById('modalStudentContent').innerHTML = `
            <div class="ficha-grid">
                <div class="ficha-box">
                    <span>Código Único de Estudiante</span>
                    <strong style="font-family:Consolas,monospace; color:#1d4ed8; font-size:1.1rem;">${escaparHtml(est.codigo)}</strong>
                </div>
                <div class="ficha-box">
                    <span>DNI / Documento</span>
                    <strong>${escaparHtml(est.dni || 'No registrado')}</strong>
                </div>
                <div class="ficha-box full">
                    <span>Apellidos y Nombres del Estudiante</span>
                    <strong>${escaparHtml(est.apellidos)}, ${escaparHtml(est.nombres)}</strong>
                </div>
                <div class="ficha-box">
                    <span>Nivel Educativo</span>
                    <strong>${escaparHtml(est.nivel)}</strong>
                </div>
                <div class="ficha-box">
                    <span>Grado y Sección</span>
                    <strong>${est.grado}° Grado - Sección "${escaparHtml(est.seccion)}"</strong>
                </div>
                <div class="ficha-box">
                    <span>Correo Electrónico del Estudiante</span>
                    <strong>${escaparHtml(est.correoEstudiante || 'No registrado')}</strong>
                </div>
                <div class="ficha-box">
                    <span>Teléfono del Estudiante</span>
                    <strong>${escaparHtml(est.telefonoEstudiante || 'No registrado')}</strong>
                </div>
                <div class="ficha-box full">
                    <span>Apoderado / Padre / Madre (${escaparHtml(est.parentescoApoderado || 'Apoderado')})</span>
                    <strong>${escaparHtml(est.nombresApoderado)} ${escaparHtml(est.apellidosApoderado)}</strong>
                </div>
                <div class="ficha-box">
                    <span>Teléfono del Apoderado</span>
                    <strong>${escaparHtml(est.telefonoApoderado || 'No registrado')}</strong>
                </div>
                <div class="ficha-box">
                    <span>Correo del Apoderado</span>
                    <strong>${escaparHtml(est.correoApoderado || 'No registrado')}</strong>
                </div>
                <div class="ficha-box full">
                    <span>Observaciones Administrativas y Estado</span>
                    <strong>Estado: ${escaparHtml(est.estado || 'Activo')} | ${escaparHtml(est.observaciones || 'Sin observaciones adicionales.')}</strong>
                </div>
            </div>
        `;

        studentModal.classList.remove('hidden');
    }

    document.getElementById('btnCloseModal').addEventListener('click', () => {
        studentModal.classList.add('hidden');
    });

    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) studentModal.classList.add('hidden');
    });

    document.getElementById('btnPrintFicha').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btnEditFromModal').addEventListener('click', () => {
        studentModal.classList.add('hidden');
        if (estudianteActualModal) {
            cambiarSubapartado('corregir', estudianteActualModal);
        }
    });

    // Delegación de eventos para botones "Ver Ficha" y "Corregir Datos" en cualquier tabla
    document.body.addEventListener('click', (e) => {
        const btnFicha = e.target.closest('[data-ver-ficha]');
        if (btnFicha) {
            abrirModalFichaEstudiante(btnFicha.dataset.verFicha);
            return;
        }
        const btnCorregir = e.target.closest('[data-ir-corregir]');
        if (btnCorregir) {
            cambiarSubapartado('corregir', btnCorregir.dataset.irCorregir);
        }
    });

    // =========================================================================
    // 8. EXPORTACIÓN A EXCEL (.XLSX) Y GESTIÓN DE BASE DE DATOS
    // =========================================================================
    function descargarExcelGeneral() {
        const todos = db.obtenerTodos();
        if (todos.length === 0) {
            mostrarNotificacion('La base de datos está vacía. Registre al menos un estudiante para exportar.', 'error');
            return;
        }
        excel.exportarExcelXLSX(todos);
        mostrarNotificacion(`Base de datos exportada a Excel (.xlsx) con ${todos.length} estudiantes.`, 'success');
    }

    document.getElementById('btnTopExportExcel').addEventListener('click', descargarExcelGeneral);
    document.getElementById('btnSidebarExportExcel').addEventListener('click', descargarExcelGeneral);
    document.getElementById('btnDbExportXlsx').addEventListener('click', descargarExcelGeneral);

    document.getElementById('btnDbExportCsvFull').addEventListener('click', () => {
        const todos = db.obtenerTodos();
        if (todos.length === 0) {
            mostrarNotificacion('No hay registros para exportar.', 'error');
            return;
        }
        excel.exportarCSVCompleto(todos);
        mostrarNotificacion('Archivo CSV completo descargado correctamente.', 'success');
    });

    document.getElementById('btnDbExportCsvCSharp').addEventListener('click', () => {
        const todos = db.obtenerTodos();
        if (todos.length === 0) {
            mostrarNotificacion('No hay registros para exportar.', 'error');
            return;
        }
        excel.exportarCSVCSharp(todos);
        mostrarNotificacion('Archivo estudiantes.csv (compatible con C#) descargado.', 'success');
    });

    document.getElementById('btnProcessImport').addEventListener('click', () => {
        const fileInput = document.getElementById('inputImportCsv');
        if (!fileInput.files || fileInput.files.length === 0) {
            mostrarNotificacion('Seleccione primero un archivo .csv para importar.', 'error');
            return;
        }

        const archivo = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const texto = e.target.result;
                const registros = excel.parsearCSV(texto);
                if (registros.length === 0) {
                    mostrarNotificacion('El archivo CSV no contiene registros válidos.', 'error');
                    return;
                }
                const res = db.importarRegistros(registros, 'combinar');
                fileInput.value = '';
                actualizarIndicadoresGlobales();
                mostrarNotificacion(
                    `Importación exitosa: ${res.insertados} nuevos y ${res.actualizados} actualizados.`,
                    'success'
                );
            } catch (err) {
                mostrarNotificacion('Error al procesar el archivo CSV.', 'error');
            }
        };
        reader.readAsText(archivo, 'UTF-8');
    });

    document.getElementById('btnRestoreSeed').addEventListener('click', () => {
        if (window.confirm('¿Desea restaurar los 5 estudiantes de demostración iniciales?')) {
            db.restaurarSemilla();
            actualizarIndicadoresGlobales();
            renderizarDashboard();
            mostrarNotificacion('Datos de demostración restaurados correctamente.', 'success');
        }
    });

    document.getElementById('btnClearDatabase').addEventListener('click', () => {
        if (window.confirm('¿Está seguro de vaciar toda la base de datos? Asegúrese de haber exportado su Excel antes.')) {
            db.vaciarBaseDeDatos();
            actualizarIndicadoresGlobales();
            renderizarDashboard();
            mostrarNotificacion('La base de datos ha sido vaciada.', 'info');
        }
    });

    // =========================================================================
    // 9. UTILIDADES DE INTERFAZ Y NOTIFICACIONES
    // =========================================================================
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensaje;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 3800);
    }

    function escaparHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Inicialización al cargar la página
    actualizarIndicadoresGlobales();
    renderizarDashboard();
});
