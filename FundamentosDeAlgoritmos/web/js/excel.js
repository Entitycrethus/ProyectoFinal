/**
 * Motor Nativo de Exportación e Importación Excel (.xlsx OpenXML y .csv)
 * Funciona 100% sin conexión a internet y genera archivos .xlsx nativos con estilos
 * para Microsoft Excel, LibreOffice Calc y Google Sheets.
 */

const ExcelServicio = {
    /**
     * Tabla y cálculo CRC32 para empaquetado ZIP estándar (OpenXML .xlsx)
     */
    _crcTable: null,

    _obtenerTablaCRC() {
        if (this._crcTable) return this._crcTable;
        const table = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[n] = c >>> 0;
        }
        this._crcTable = table;
        return table;
    },

    _crc32(bytes) {
        const table = this._obtenerTablaCRC();
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) {
            crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    },

    /**
     * Empaqueta archivos en un contenedor ZIP válido en memoria (método STORE)
     */
    _crearZip(archivos) {
        const encoder = new TextEncoder();
        const entradas = archivos.map(arch => {
            const nombreBytes = encoder.encode(arch.nombre);
            const datosBytes = typeof arch.contenido === 'string'
                ? encoder.encode(arch.contenido)
                : arch.contenido;
            const crc = this._crc32(datosBytes);
            return { nombreBytes, datosBytes, crc };
        });

        let tamanoLocal = 0;
        let tamanoCentral = 0;
        for (const e of entradas) {
            tamanoLocal += 30 + e.nombreBytes.length + e.datosBytes.length;
            tamanoCentral += 46 + e.nombreBytes.length;
        }

        const totalBytes = tamanoLocal + tamanoCentral + 22;
        const buffer = new ArrayBuffer(totalBytes);
        const view = new DataView(buffer);
        const u8 = new Uint8Array(buffer);

        let offsetLocal = 0;
        const offsets = [];

        // 1. Local File Headers + Data
        for (const e of entradas) {
            offsets.push(offsetLocal);
            view.setUint32(offsetLocal, 0x04034b50, true); // Local file header signature
            view.setUint16(offsetLocal + 4, 20, true);     // Version needed to extract (2.0)
            view.setUint16(offsetLocal + 6, 0x0800, true); // UTF-8 flag
            view.setUint16(offsetLocal + 8, 0, true);      // Compression method (0 = Store)
            view.setUint16(offsetLocal + 10, 0, true);     // Last mod time
            view.setUint16(offsetLocal + 12, 0x5521, true);// Last mod date
            view.setUint32(offsetLocal + 14, e.crc, true); // CRC-32
            view.setUint32(offsetLocal + 18, e.datosBytes.length, true); // Compressed size
            view.setUint32(offsetLocal + 22, e.datosBytes.length, true); // Uncompressed size
            view.setUint16(offsetLocal + 26, e.nombreBytes.length, true); // File name length
            view.setUint16(offsetLocal + 28, 0, true);     // Extra field length

            u8.set(e.nombreBytes, offsetLocal + 30);
            u8.set(e.datosBytes, offsetLocal + 30 + e.nombreBytes.length);
            offsetLocal += 30 + e.nombreBytes.length + e.datosBytes.length;
        }

        // 2. Central Directory
        let offsetCentral = offsetLocal;
        for (let i = 0; i < entradas.length; i++) {
            const e = entradas[i];
            view.setUint32(offsetCentral, 0x02014b50, true); // Central directory signature
            view.setUint16(offsetCentral + 4, 20, true);     // Version made by
            view.setUint16(offsetCentral + 6, 20, true);     // Version needed
            view.setUint16(offsetCentral + 8, 0x0800, true); // UTF-8 flag
            view.setUint16(offsetCentral + 10, 0, true);     // Compression method
            view.setUint16(offsetCentral + 12, 0, true);     // Mod time
            view.setUint16(offsetCentral + 14, 0x5521, true);// Mod date
            view.setUint32(offsetCentral + 16, e.crc, true); // CRC-32
            view.setUint32(offsetCentral + 20, e.datosBytes.length, true);
            view.setUint32(offsetCentral + 24, e.datosBytes.length, true);
            view.setUint16(offsetCentral + 28, e.nombreBytes.length, true);
            view.setUint16(offsetCentral + 30, 0, true);     // Extra length
            view.setUint16(offsetCentral + 32, 0, true);     // Comment length
            view.setUint16(offsetCentral + 34, 0, true);     // Disk number
            view.setUint16(offsetCentral + 36, 0, true);     // Internal attrs
            view.setUint32(offsetCentral + 38, 0, true);     // External attrs
            view.setUint32(offsetCentral + 42, offsets[i], true); // Relative offset

            u8.set(e.nombreBytes, offsetCentral + 46);
            offsetCentral += 46 + e.nombreBytes.length;
        }

        // 3. End of Central Directory Record
        view.setUint32(offsetCentral, 0x06054b50, true);
        view.setUint16(offsetCentral + 4, 0, true);
        view.setUint16(offsetCentral + 6, 0, true);
        view.setUint16(offsetCentral + 8, entradas.length, true);
        view.setUint16(offsetCentral + 10, entradas.length, true);
        view.setUint32(offsetCentral + 12, tamanoCentral, true);
        view.setUint32(offsetCentral + 16, offsetLocal, true);
        view.setUint16(offsetCentral + 20, 0, true);

        return new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    },

    _escaparXml(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    },

    _columnaExcel(indiceCero) {
        let col = '';
        let n = indiceCero;
        while (n >= 0) {
            col = String.fromCharCode((n % 26) + 65) + col;
            n = Math.floor(n / 26) - 1;
        }
        return col;
    },

    _construirHojaXml(tituloReporte, subtitulo, encabezados, filas, anchosColumna) {
        const colsXml = anchosColumna
            .map((ancho, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${ancho}" customWidth="1"/>`)
            .join('');

        const ultimaCol = this._columnaExcel(encabezados.length - 1);
        let rowsXml = '';

        // Fila 1: Título Institucional
        rowsXml += `<row r="1" ht="26" customHeight="1">`;
        rowsXml += `<c r="A1" s="1" t="inlineStr"><is><t>${this._escaparXml(tituloReporte)}</t></is></c>`;
        for (let c = 1; c < encabezados.length; c++) {
            rowsXml += `<c r="${this._columnaExcel(c)}1" s="1"/>`;
        }
        rowsXml += `</row>`;

        // Fila 2: Subtítulo y Fecha de generación
        rowsXml += `<row r="2" ht="18" customHeight="1">`;
        rowsXml += `<c r="A2" s="2" t="inlineStr"><is><t>${this._escaparXml(subtitulo)}</t></is></c>`;
        for (let c = 1; c < encabezados.length; c++) {
            rowsXml += `<c r="${this._columnaExcel(c)}2" s="2"/>`;
        }
        rowsXml += `</row>`;

        // Fila 4: Encabezados de Tabla
        rowsXml += `<row r="4" ht="22" customHeight="1">`;
        encabezados.forEach((enc, idxCol) => {
            const ref = `${this._columnaExcel(idxCol)}4`;
            rowsXml += `<c r="${ref}" s="3" t="inlineStr"><is><t>${this._escaparXml(enc)}</t></is></c>`;
        });
        rowsXml += `</row>`;

        // Filas de Datos (desde la fila 5)
        filas.forEach((fila, idxFila) => {
            const numFila = idxFila + 5;
            const estiloBase = idxFila % 2 === 0 ? 4 : 5;
            rowsXml += `<row r="${numFila}" ht="19" customHeight="1">`;
            fila.forEach((celda, idxCol) => {
                const ref = `${this._columnaExcel(idxCol)}${numFila}`;
                if (typeof celda === 'number' && !isNaN(celda)) {
                    rowsXml += `<c r="${ref}" s="${estiloBase}"><v>${celda}</v></c>`;
                } else {
                    rowsXml += `<c r="${ref}" s="${estiloBase}" t="inlineStr"><is><t>${this._escaparXml(celda)}</t></is></c>`;
                }
            });
            rowsXml += `</row>`;
        });

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
  <mergeCells count="2">
    <mergeCell ref="A1:${ultimaCol}1"/>
    <mergeCell ref="A2:${ultimaCol}2"/>
  </mergeCells>
</worksheet>`;
    },

    /**
     * Genera y descarga un archivo .xlsx nativo con hojas separadas:
     * 1. Padrón General
     * 2. Nivel Primaria
     * 3. Nivel Secundaria
     */
    exportarExcelXLSX(estudiantes, nombreArchivo = null) {
        const fechaHoy = new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const encabezados = [
            'CÓDIGO ESTUDIANTE',
            'DNI',
            'APELLIDOS DEL ESTUDIANTE',
            'NOMBRES DEL ESTUDIANTE',
            'NIVEL',
            'GRADO',
            'SECCIÓN',
            'AULA',
            'CORREO ESTUDIANTE',
            'TELÉFONO ESTUDIANTE',
            'PARENTESCO APODERADO',
            'APELLIDOS DEL APODERADO',
            'NOMBRES DEL APODERADO',
            'TELÉFONO APODERADO',
            'CORREO APODERADO',
            'ESTADO',
            'OBSERVACIONES',
            'FECHA REGISTRO'
        ];

        const anchos = [20, 13, 25, 25, 14, 10, 10, 12, 30, 18, 20, 25, 25, 18, 28, 13, 32, 18];

        const mapearFilas = (lista) => lista.map(e => [
            e.codigo || '',
            e.dni || 'S/D',
            e.apellidos || '',
            e.nombres || '',
            e.nivel || '',
            Number(e.grado) || 1,
            e.seccion || '',
            `${e.grado}° "${e.seccion}"`,
            e.correoEstudiante || 'No registrado',
            e.telefonoEstudiante || 'No registrado',
            e.parentescoApoderado || 'Apoderado',
            e.apellidosApoderado || '',
            e.nombresApoderado || '',
            e.telefonoApoderado || '',
            e.correoApoderado || 'No registrado',
            e.estado || 'Activo',
            e.observaciones || '-',
            e.fechaRegistro ? new Date(e.fechaRegistro).toLocaleDateString('es-PE') : '-'
        ]);

        const listaPrimaria = estudiantes.filter(e => e.nivel === 'Primaria');
        const listaSecundaria = estudiantes.filter(e => e.nivel === 'Secundaria');

        const sheetGeneral = this._construirHojaXml(
            'INSTITUCIÓN EDUCATIVA - PADRÓN GENERAL DE ESTUDIANTES Y APODERADOS',
            `Total de registros: ${estudiantes.length} estudiantes | Generado el: ${fechaHoy}`,
            encabezados,
            mapearFilas(estudiantes),
            anchos
        );

        const sheetPrimaria = this._construirHojaXml(
            'INSTITUCIÓN EDUCATIVA - NÓMINA DE NIVEL PRIMARIA',
            `Total en Primaria: ${listaPrimaria.length} estudiantes | Generado el: ${fechaHoy}`,
            encabezados,
            mapearFilas(listaPrimaria),
            anchos
        );

        const sheetSecundaria = this._construirHojaXml(
            'INSTITUCIÓN EDUCATIVA - NÓMINA DE NIVEL SECUNDARIA',
            `Total en Secundaria: ${listaSecundaria.length} estudiantes | Generado el: ${fechaHoy}`,
            encabezados,
            mapearFilas(listaSecundaria),
            anchos
        );

        const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

        const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

        const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Padron General" sheetId="1" r:id="rId1"/>
    <sheet name="Primaria" sheetId="2" r:id="rId2"/>
    <sheet name="Secundaria" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`;

        const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

        const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF334155"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment vertical="center" indent="1"/>
    </xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment vertical="center" indent="1"/>
    </xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
    <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment vertical="center"/>
    </xf>
  </cellXfs>
</styleSheet>`;

        const blob = this._crearZip([
            { nombre: '[Content_Types].xml', contenido: contentTypesXml },
            { nombre: '_rels/.rels', contenido: relsXml },
            { nombre: 'xl/workbook.xml', contenido: workbookXml },
            { nombre: 'xl/_rels/workbook.xml.rels', contenido: workbookRelsXml },
            { nombre: 'xl/styles.xml', contenido: stylesXml },
            { nombre: 'xl/worksheets/sheet1.xml', contenido: sheetGeneral },
            { nombre: 'xl/worksheets/sheet2.xml', contenido: sheetPrimaria },
            { nombre: 'xl/worksheets/sheet3.xml', contenido: sheetSecundaria }
        ]);

        const fechaCorta = new Date().toISOString().slice(0, 10);
        const archivoFinal = nombreArchivo || `BaseDatos_Estudiantes_IE_${fechaCorta}.xlsx`;
        this._descargarBlob(blob, archivoFinal);
    },

    /**
     * Exporta toda la base de datos a CSV completo (compatible con Excel con soporte de tildes UTF-8 BOM)
     */
    exportarCSVCompleto(estudiantes) {
        const encabezados = [
            'Codigo', 'DNI', 'Nombres', 'Apellidos', 'Nivel', 'Grado', 'Seccion',
            'CorreoEstudiante', 'TelefonoEstudiante', 'ParentescoApoderado',
            'NombresApoderado', 'ApellidosApoderado', 'TelefonoApoderado',
            'CorreoApoderado', 'Estado', 'Observaciones'
        ];

        const escaparCsv = (val) => {
            const str = String(val ?? '').replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        };

        const lineas = [encabezados.join(',')];
        for (const e of estudiantes) {
            lineas.push([
                e.codigo,
                e.dni,
                e.nombres,
                e.apellidos,
                e.nivel,
                e.grado,
                e.seccion,
                e.correoEstudiante,
                e.telefonoEstudiante,
                e.parentescoApoderado,
                e.nombresApoderado,
                e.apellidosApoderado,
                e.telefonoApoderado,
                e.correoApoderado,
                e.estado,
                e.observaciones
            ].map(escaparCsv).join(','));
        }

        const contenido = '\uFEFF' + lineas.join('\r\n');
        const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        const fechaCorta = new Date().toISOString().slice(0, 10);
        this._descargarBlob(blob, `Padron_Completo_IE_${fechaCorta}.csv`);
    },

    /**
     * Exporta en el formato exacto de estudiantes.csv del proyecto C# (DNI,Nombres,Apellidos,Nivel,Grado,Seccion,Contacto)
     */
    exportarCSVCSharp(estudiantes) {
        const lineas = ['DNI,Nombres,Apellidos,Nivel,Grado,Seccion,Contacto'];
        for (const e of estudiantes) {
            const dni = (e.dni && e.dni.length === 8) ? e.dni : '00000000';
            const contacto = e.telefonoApoderado || e.telefonoEstudiante || '900000000';
            lineas.push(`${dni},${e.nombres},${e.apellidos},${e.nivel},${e.grado},${e.seccion},${contacto}`);
        }
        const contenido = '\uFEFF' + lineas.join('\r\n');
        const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
        this._descargarBlob(blob, 'estudiantes.csv');
    },

    /**
     * Parsea un archivo CSV (tanto el formato completo web como el formato estudiantes.csv de C#)
     */
    parsearCSV(texto) {
        const limpio = texto.replace(/^\uFEFF/, '').trim();
        const lineas = limpio.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lineas.length < 2) return [];

        const cabeceras = this._dividirLineaCSV(lineas[0]).map(h => h.trim().toLowerCase());
        const registros = [];

        for (let i = 1; i < lineas.length; i++) {
            const valores = this._dividirLineaCSV(lineas[i]);
            if (valores.length < 4) continue;

            // Detectar si es el formato de 7 columnas de C#: DNI,Nombres,Apellidos,Nivel,Grado,Seccion,Contacto
            if (cabeceras.length === 7 && cabeceras[0] === 'dni' && cabeceras[6] === 'contacto') {
                registros.push({
                    dni: valores[0],
                    nombres: valores[1],
                    apellidos: valores[2],
                    nivel: valores[3],
                    grado: parseInt(valores[4], 10) || 1,
                    seccion: valores[5],
                    telefonoEstudiante: valores[6],
                    telefonoApoderado: valores[6],
                    nombresApoderado: 'Registrado por Consola',
                    apellidosApoderado: valores[2]
                });
            } else {
                const obj = {};
                cabeceras.forEach((col, idx) => {
                    obj[col] = valores[idx] || '';
                });
                registros.push({
                    codigo: obj.codigo || obj['código estudiante'] || '',
                    dni: obj.dni || '',
                    nombres: obj.nombres || obj['nombres del estudiante'] || '',
                    apellidos: obj.apellidos || obj['apellidos del estudiante'] || '',
                    nivel: obj.nivel || 'Primaria',
                    grado: parseInt(obj.grado, 10) || 1,
                    seccion: obj.seccion || obj['sección'] || 'A',
                    correoEstudiante: obj.correoestudiante || obj['correo estudiante'] || '',
                    telefonoEstudiante: obj.telefonoestudiante || obj['teléfono estudiante'] || '',
                    parentescoApoderado: obj.parentescoapoderado || obj['parentesco apoderado'] || 'Apoderado / Tutor',
                    nombresApoderado: obj.nombresapoderado || obj['nombres del apoderado'] || '',
                    apellidosApoderado: obj.apellidosapoderado || obj['apellidos del apoderado'] || '',
                    telefonoApoderado: obj.telefonoapoderado || obj['teléfono apoderado'] || obj.contacto || '',
                    correoApoderado: obj.correoapoderado || obj['correo apoderado'] || '',
                    estado: obj.estado || 'Activo',
                    observaciones: obj.observaciones || ''
                });
            }
        }
        return registros;
    },

    _dividirLineaCSV(linea) {
        const resultado = [];
        let actual = '';
        let enComillas = false;
        for (let i = 0; i < linea.length; i++) {
            const c = linea[i];
            if (c === '"') {
                if (enComillas && linea[i + 1] === '"') {
                    actual += '"';
                    i++;
                } else {
                    enComillas = !enComillas;
                }
            } else if ((c === ',' || c === ';') && !enComillas) {
                resultado.push(actual.trim());
                actual = '';
            } else {
                actual += c;
            }
        }
        resultado.push(actual.trim());
        return resultado;
    },

    _descargarBlob(blob, nombreArchivo) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
};

window.ExcelServicio = ExcelServicio;
