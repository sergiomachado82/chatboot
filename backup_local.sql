--
-- PostgreSQL database dump
--

\restrict P6F6goq79p5dXfZZxjqqWRG6Xlzb07tE5FQfRvNhBDgLtJlvL4gcJGQl6pcaK9S

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: agentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agentes (
    id text NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    rol text DEFAULT 'agente'::text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    online boolean DEFAULT false NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.agentes OWNER TO postgres;

--
-- Name: bloqueos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bloqueos (
    id text NOT NULL,
    complejo_id text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    motivo text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unidades integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.bloqueos OWNER TO postgres;

--
-- Name: bot_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bot_config (
    id text NOT NULL,
    nombre_agente text DEFAULT 'Las Grutas Departamentos'::text NOT NULL,
    ubicacion text DEFAULT 'Las Grutas, Rio Negro, Patagonia Argentina'::text NOT NULL,
    tono text DEFAULT 'amable, profesional y cercano'::text NOT NULL,
    idioma text DEFAULT 'es_AR'::text NOT NULL,
    usar_emojis boolean DEFAULT false NOT NULL,
    longitud_respuesta text DEFAULT 'corta'::text NOT NULL,
    auto_pre_reserva boolean DEFAULT true NOT NULL,
    modo_envio_fotos text DEFAULT 'auto'::text NOT NULL,
    escalar_si_queja boolean DEFAULT true NOT NULL,
    escalar_si_pago boolean DEFAULT true NOT NULL,
    mensaje_bienvenida text DEFAULT 'Hola! Bienvenido a Las Grutas Departamentos. Tenemos departamentos a pocas cuadras de la playa en Las Grutas, Rio Negro. En que puedo ayudarte? Puedo informarte sobre disponibilidad, precios, departamentos o actividades en la zona.'::text NOT NULL,
    mensaje_despedida text DEFAULT 'Gracias por contactarnos! Si necesitas algo mas, no dudes en escribirnos. Que tengas un excelente dia!'::text NOT NULL,
    mensaje_fuera_horario text DEFAULT 'Gracias por tu mensaje. En este momento estamos fuera de horario. Te responderemos a la brevedad.'::text NOT NULL,
    mensaje_espera_humano text DEFAULT 'Entendido, te voy a comunicar con uno de nuestros agentes. Te va a atender en breve. Gracias por tu paciencia.'::text NOT NULL,
    horario_inicio text,
    horario_fin text,
    telefono_contacto text DEFAULT '+54 2920 561033'::text NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bot_config OWNER TO postgres;

--
-- Name: complejos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.complejos (
    id text NOT NULL,
    nombre text NOT NULL,
    aliases text[] DEFAULT ARRAY[]::text[],
    direccion text,
    ubicacion text,
    tipo text,
    superficie text,
    capacidad integer DEFAULT 4 NOT NULL,
    dormitorios integer DEFAULT 1 NOT NULL,
    banos integer DEFAULT 1 NOT NULL,
    amenities text[] DEFAULT ARRAY[]::text[],
    check_in text,
    check_out text,
    estadia_minima integer,
    mascotas boolean DEFAULT false NOT NULL,
    ninos boolean DEFAULT true NOT NULL,
    fumar boolean DEFAULT false NOT NULL,
    fiestas boolean DEFAULT false NOT NULL,
    video_tour text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    alias_cbu text,
    banco text,
    cbu text,
    cuit text,
    link_mercadopago text,
    titular_cuenta text,
    cantidad_unidades integer DEFAULT 1 NOT NULL,
    porcentaje_reserva integer DEFAULT 30 NOT NULL,
    ical_url text
);


ALTER TABLE public.complejos OWNER TO postgres;

--
-- Name: conversaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversaciones (
    id text NOT NULL,
    huesped_id text NOT NULL,
    agente_id text,
    estado text DEFAULT 'bot'::text NOT NULL,
    ultimo_mensaje text,
    ultimo_mensaje_en timestamp(3) without time zone,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversaciones OWNER TO postgres;

--
-- Name: huespedes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.huespedes (
    id text NOT NULL,
    wa_id text NOT NULL,
    nombre text,
    telefono text,
    email text,
    notas text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.huespedes OWNER TO postgres;

--
-- Name: inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario (
    id text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    habitacion text NOT NULL,
    disponible boolean DEFAULT true NOT NULL,
    precio numeric(65,30) DEFAULT 0 NOT NULL,
    notas text
);


ALTER TABLE public.inventario OWNER TO postgres;

--
-- Name: media_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media_files (
    id text NOT NULL,
    complejo_id text NOT NULL,
    tipo text DEFAULT 'image'::text NOT NULL,
    url text NOT NULL,
    caption text,
    orden integer DEFAULT 0 NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.media_files OWNER TO postgres;

--
-- Name: mensajes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mensajes (
    id text NOT NULL,
    conversacion_id text NOT NULL,
    tipo text DEFAULT 'text'::text NOT NULL,
    direccion text NOT NULL,
    origen text NOT NULL,
    contenido text NOT NULL,
    metadata jsonb,
    wa_message_id text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.mensajes OWNER TO postgres;

--
-- Name: reservas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservas (
    id text NOT NULL,
    huesped_id text,
    conversacion_id text,
    fecha_entrada timestamp(3) without time zone NOT NULL,
    fecha_salida timestamp(3) without time zone NOT NULL,
    num_huespedes integer DEFAULT 1 NOT NULL,
    habitacion text,
    precio_total numeric(65,30) DEFAULT 0 NOT NULL,
    estado text DEFAULT 'pre_reserva'::text NOT NULL,
    notas text,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL,
    importe_usd numeric(65,30),
    monto_reserva numeric(65,30),
    nombre_huesped text,
    nro_factura text,
    origen_reserva text,
    saldo numeric(65,30),
    tarifa_noche numeric(65,30),
    telefono_huesped text
);


ALTER TABLE public.reservas OWNER TO postgres;

--
-- Name: tarifas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarifas (
    id text NOT NULL,
    complejo_id text NOT NULL,
    temporada text NOT NULL,
    precio_noche numeric(65,30) NOT NULL,
    estadia_minima integer
);


ALTER TABLE public.tarifas OWNER TO postgres;

--
-- Name: tarifas_especiales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarifas_especiales (
    id text NOT NULL,
    complejo_id text NOT NULL,
    fecha_inicio timestamp(3) without time zone NOT NULL,
    fecha_fin timestamp(3) without time zone NOT NULL,
    precio_noche numeric(65,30) NOT NULL,
    estadia_minima integer,
    motivo text,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actualizado_en timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tarifas_especiales OWNER TO postgres;

--
-- Name: wa_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wa_templates (
    id text NOT NULL,
    nombre text NOT NULL,
    idioma text DEFAULT 'es'::text NOT NULL,
    contenido text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wa_templates OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b83ba7d8-4af5-4655-91c7-c53359faad90	d03056f9457565a4e49b1fcd3f3095a6740b63abd03474bbacb49d2687a7b16a	2026-02-26 23:02:56.419189+00	20260226230256_init	\N	\N	2026-02-26 23:02:56.257276+00	1
1b999ef6-3d4a-4e7f-82ee-a841f1259ca2	8f2c1099220510964a5b4a3561e81e633d49b29486ae5a695a1eec3e01719890	2026-03-07 00:36:56.820903+00	20260307003656_add_complejos	\N	\N	2026-03-07 00:36:56.668583+00	1
4163b294-19ce-4922-bc58-9b2634293670	3f82cf51ec0b57a42f802eb0cc0c4e1dac3020111686a84920c2038bf8a017df	2026-03-07 01:18:58.896226+00	20260307011858_add_datos_bancarios	\N	\N	2026-03-07 01:18:58.848594+00	1
9afac1fd-f3d0-46c9-8190-575329d8ed6f	1aa15140e0bc61a7fb6c5ea02b014e1be471e506198d2fe0791343259dd83333	2026-03-07 01:30:22.137693+00	20260307013021_add_manual_reserva_fields	\N	\N	2026-03-07 01:30:22.038973+00	1
53a45598-233e-4330-9bfe-4eb75245d7df	917724cbb332040455fcedbfffa83ef6419a8b7bc450f93aa0445ddfcebb6424	2026-03-07 01:40:06.680415+00	20260307013959_add_cantidad_unidades	\N	\N	2026-03-07 01:40:06.668662+00	1
145f8a46-a9ec-48d1-b3c8-83060e18426e	4117c22ecf2ee5f30c1791755e57b9c29fe31cc89db670e322fb5e428bff6036	2026-03-07 15:14:56.039429+00	20260307151455_add_estadia_minima_tarifas_especiales	\N	\N	2026-03-07 15:14:55.961987+00	1
5de77184-fb71-408b-a605-587c613b8b19	5f352f1dbbaf8d5f430818aeab3f1ebb03f2b7421f4045633e37252c99632474	2026-03-07 15:41:29.79663+00	20260307154129_add_bloqueos	\N	\N	2026-03-07 15:41:29.735736+00	1
2d5baccb-df62-40fd-84c1-89d3c463163f	b76732210b5d696142fcc48fb15bbd81be350e1edab1cd2b3b5628e98d17df8b	2026-03-10 02:01:08.856837+00	20260310020108_add_porcentaje_reserva	\N	\N	2026-03-10 02:01:08.817623+00	1
3cdfb0df-af2a-40fb-a587-22852cb2c2d9	0e99e1abeaa57f429dd60e258ebb98a6859280cad1d909e69c390d989adcf031	2026-03-10 13:47:17.005616+00	20260310134716_add_bloqueo_unidades	\N	\N	2026-03-10 13:47:16.991428+00	1
79c7f5c8-7072-477e-951e-b964164d1dba	46d69c4e5e8f1a848bd85ebb812587de5743c168e9e1ba90f2ed2d89807df79d	2026-03-10 14:11:12.237653+00	20260310141112_add_complejo_ical_url	\N	\N	2026-03-10 14:11:12.225876+00	1
345c43f8-acf2-4249-a84a-ef006c053171	48d5c807db9ef7501e5f05be3d161033d6975c69da9e0a7f6f9749bbb2037f93	2026-03-10 16:53:09.315079+00	20260310165309_add_bot_config	\N	\N	2026-03-10 16:53:09.257047+00	1
\.


--
-- Data for Name: agentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agentes (id, nombre, email, password_hash, rol, activo, online, creado_en) FROM stdin;
cmm42k4k90000ib6sdlu1wxym	Admin	admin@chatboot.com	$2b$12$4TXmlZx1pg0pkHRBr86r6O6B1LVw9ogajjRsb2X3C4ib2u6/kVOHS	admin	t	f	2026-02-26 23:03:04.473
\.


--
-- Data for Name: bloqueos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bloqueos (id, complejo_id, fecha_inicio, fecha_fin, motivo, creado_en, unidades) FROM stdin;
\.


--
-- Data for Name: bot_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bot_config (id, nombre_agente, ubicacion, tono, idioma, usar_emojis, longitud_respuesta, auto_pre_reserva, modo_envio_fotos, escalar_si_queja, escalar_si_pago, mensaje_bienvenida, mensaje_despedida, mensaje_fuera_horario, mensaje_espera_humano, horario_inicio, horario_fin, telefono_contacto, creado_en, actualizado_en) FROM stdin;
cmmkv6usu0000iblsiomt6q8q	Las Grutas Departamentos	Las Grutas, Rio Negro, Patagonia Argentina	amable, profesional y cercano	es_AR	f	corta	t	auto	t	t	Hola! Bienvenido a Las Grutas Departamentos. Tenemos departamentos a pocas cuadras de la playa en Las Grutas, Rio Negro. En que puedo ayudarte? Puedo informarte sobre disponibilidad, precios, departamentos o actividades en la zona.	Gracias por contactarnos! Si necesitas algo mas, no dudes en escribirnos. Que tengas un excelente dia!	Gracias por tu mensaje. En este momento estamos fuera de horario. Te responderemos a la brevedad.	Entendido, te voy a comunicar con uno de nuestros agentes. Te va a atender en breve. Gracias por tu paciencia.	07:00	00:00	+54 2920 561033	2026-03-10 17:08:52.975	2026-03-10 17:27:20.488
\.


--
-- Data for Name: complejos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.complejos (id, nombre, aliases, direccion, ubicacion, tipo, superficie, capacidad, dormitorios, banos, amenities, check_in, check_out, estadia_minima, mascotas, ninos, fumar, fiestas, video_tour, activo, creado_en, actualizado_en, alias_cbu, banco, cbu, cuit, link_mercadopago, titular_cuenta, cantidad_unidades, porcentaje_reserva, ical_url) FROM stdin;
cmmfli0dg0000ibnwjrbo81yn	Pewmafe	{pewmafe,pew,pewma}	Punta Perdices 370, Las Grutas	a 2 cuadras de la playa (bajada La Rinconada)	Departamento 2 ambientes	\N	4	1	1	{"aire acondicionado","Smart TV",Wi-Fi,"cocina totalmente equipada","patio individual","estacionamiento (cochera)","parrilla individual","ropa de cama incluida (toallas NO incluidas)"}	14:00	10:00	\N	f	t	f	f	https://www.youtube.com/watch?v=tz8rK2PkjjQ	t	2026-03-07 00:38:46.372	2026-03-10 02:13:55.514	es.una.prueba	Banco Nacion	238493824972389472398478923479832	20295178389	\N	Sergio Machado	3	40	\N
cmmfli0du000aibnwm5xfvig5	Luminar Mono	{"luminar mono","luminar monoambiente",monoambiente,mono}	Golfo San Jorge 560, Las Grutas	a 2-3 cuadras de la playa (bajada Los Acantilados)	Monoambiente	35-40 m2	3	0	1	{"aire acondicionado","TV con cable",Wi-Fi,"cocina completa (heladera, microondas, vajilla)","barra desayunador",placard,"ventanal amplio con solarium","estacionamiento cubierto dentro del complejo","ropa de cama incluida (toallas NO incluidas)"}	13:00	24:00	\N	f	t	f	f	https://www.youtube.com/watch?v=sIBaRPlJYQk	t	2026-03-07 00:38:46.387	2026-03-08 01:34:04.974	\N	\N	\N	\N	\N	\N	1	30	\N
cmmfli0ec000iibnwg07zkpy8	Luminar 2Amb	{"luminar 2amb","luminar 2 ambientes","luminar 2 amb","2 ambientes",2amb}	Golfo San Jorge 560, Las Grutas	a 2 cuadras de la playa (bajada Los Acantilados)	Departamento 2 ambientes	45-50 m2	4	1	1	{"aire acondicionado","Smart TV con cable",Wi-Fi,"cocina completa (heladera, microondas, vajilla)","barra desayunador",placard,"patio cubierto/solarium con parrilla","estacionamiento cubierto dentro del complejo","ropa de cama incluida (toallas NO incluidas)"}	10:00	14:00	\N	f	t	f	f	\N	t	2026-03-07 00:38:46.404	2026-03-08 01:34:04.985	\N	\N	\N	\N	\N	\N	1	30	\N
cmmfli0ek000sibnw1y5xo5eq	LG	{lg,"departamentos lg","depto lg"}	Golfo San Jorge 560, Las Grutas	a 2 cuadras del mar (bajada Los Acantilados)	Departamento 2 ambientes	50 m2	4	1	1	{"aire acondicionado","TV LED",Wi-Fi,"cable TV","cocina con heladera y microondas","solarium con ventanales amplios","estacionamiento cubierto dentro del complejo",parrilla,"ropa de cama incluida (toallas NO incluidas)"}	13:00	24:00	\N	f	t	f	f	\N	t	2026-03-07 00:38:46.412	2026-03-08 01:34:04.992	\N	\N	\N	\N	\N	\N	5	30	\N
\.


--
-- Data for Name: conversaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversaciones (id, huesped_id, agente_id, estado, ultimo_mensaje, ultimo_mensaje_en, creado_en, actualizado_en) FROM stdin;
cmmfe99520002ibrwh66e0p2c	cmmfe994k0000ibrwbidpk1ey	\N	cerrado	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg	2026-03-06 21:16:17.246	2026-03-06 21:16:00.517	2026-03-09 02:39:04.322
cmmfh2d9q0002ibfkmfxxj0w5	cmmfh2d900000ibfk90lto4ln	\N	cerrado	[3 fotos de Pewmafe]	2026-03-06 22:34:49.147	2026-03-06 22:34:38.125	2026-03-09 02:39:04.345
cmmfe5pmn0011ibfsdybe9w0e	cmmfe5pm9000zibfsnc6jxmb4	\N	cerrado	¡Dale! Te paso las fotos del Luminar Monoambiente:\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0011-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0010-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0012-805x453.jpg\n\nTambién podés ver el video tour completo acá:\nhttps://www.youtube.com/watch?v=sIBaRPlJYQk\n\nY más fotos en la página del departamento:\nhttps://www.lasgrutasdepartamentos.com/properties/complejo-luminar-monoambiente/\n\n¿Te gustaría reservarlo para el 20 al 23 de julio? El total sería $255.000 (3 noches x $85.000).	2026-03-06 21:13:40.744	2026-03-06 21:13:15.264	2026-03-09 02:39:04.388
cmmfkf8qk0002ibxgub2m4h72	cmmfkf8pw0000ibxgw2dt3ur2	\N	cerrado	[3 fotos de Pewmafe]	2026-03-07 00:10:22.861	2026-03-07 00:08:37.629	2026-03-09 02:39:04.407
cmm47zv820009ibko3beup784	cmm47zv7p0007ibkouzt5q59b	\N	cerrado	Te paso las fotos principales de Pewmafe:\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg\n\nTambién podés ver más fotos y un video tour completo acá:\n\nhttps://www.lasgrutasdepartamentos.com/properties/pewmafe/\n\n¿Te gustaría saber disponibilidad y precios para alguna fecha en particular?	2026-03-06 21:10:51.287	2026-02-27 01:35:16.946	2026-03-09 02:39:04.426
cmmfe332g000eibfs1gkv1hyl	cmmfe3320000cibfshscv0ttp	\N	cerrado	¡Hola! Sí, tengo excelentes noticias: Pewmafe está disponible del 15 al 18 de abril 2026.\n\nSerían 3 noches en temporada baja, con un costo total de $210.000 ARS ($70.000 por noche).\n\nEl departamento está a solo 2 cuadras de la playa, tiene capacidad para hasta 4 personas, cocina equipada, aire acondicionado, Wi-Fi, patio con parrilla individual y cochera.\n\n¿Te gustaría confirmar la reserva o necesitás algún dato más?	2026-03-06 21:11:17.781	2026-03-06 21:11:12.713	2026-03-09 02:39:04.451
cmmfe4dhu000libfsejkaje0b	cmmfe4dhf000jibfsl28r6pk8	\N	cerrado	¡Perfecto! Te confirmo que **Pewmafe está disponible** del 15 al 18 de abril (3 noches).\n\nEl costo total sería de **$210.000 ARS** (temporada baja: $70.000 por noche).\n\nEl departamento tiene capacidad para hasta 4 personas, cuenta con 1 dormitorio matrimonial, living-comedor, cocina equipada, baño completo, aire acondicionado, Wi-Fi, Smart TV, patio con parrilla individual y cochera. Está a solo 2 cuadras de la playa.\n\n¿Te gustaría confirmar la reserva o necesitás más información?	2026-03-06 21:12:18.929	2026-03-06 21:12:12.882	2026-03-09 02:39:04.471
cmmfehcta0002ib2wrlacf4zy	cmmfehcs90000ib2wbslf3zjs	\N	cerrado	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/doritorio-805x453.jpg	2026-03-06 21:22:31.755	2026-03-06 21:22:18.526	2026-03-09 02:39:04.493
cmmfe6kqr001cibfsesgylv1j	cmmfe6kqb001aibfs8ehta4z5	\N	cerrado	¡De nada! Fue un placer ayudarte.\n\nSi tenes cualquier otra consulta, no dudes en escribirnos. ¡Que tengas un excelente dia!\n\nSaludos,\nLas Grutas Departamentos	2026-03-06 21:13:58.514	2026-03-06 21:13:55.587	2026-03-06 21:13:58.53
cmmfk7oof0004ibb0pb3dwvrj	cmmfk7onq0002ibb0jszs6vgw	\N	cerrado	Perfecto, te confirmo disponibilidad del 10 al 15 de marzo (5 noches) para 4 personas:\n\n✅ **Pewmafe**: Disponible - $350.000 total (5 noches x $70.000)\n- 2 cuadras de la playa, patio con parrilla individual, cochera propia\n\n✅ **Luminar 2 Ambientes**: Disponible - $350.000 total (5 noches x $70.000)\n- 2 cuadras de la playa, patio cubierto con parrilla, cochera en complejo\n\n✅ **Departamentos LG**: Disponible - $400.000 total (5 noches x $80.000)\n- 2 cuadras del mar, solarium amplio con parrilla, cochera en complejo\n\nLos tres están equipados con todo lo necesario: ropa de cama, toallas, cocina completa, aire acondicionado y Wi-Fi. \n\n¿Cuál te interesa más? Te puedo dar más detalles del que prefieras o si querés reservar necesito que confirmes cuál elegís.	2026-03-07 00:04:01.704	2026-03-07 00:02:45.039	2026-03-09 02:39:04.51
cmmfk9vu2000mibb0hk2migsi	cmmfk9vtr000kibb0xe2tl79t	\N	cerrado	[3 fotos de Pewmafe]	2026-03-07 00:04:28.505	2026-03-07 00:04:27.626	2026-03-09 02:39:04.542
cmmjxucfz0002ib0g1q1pcbcm	cmmjxucft0000ib0grh45u3tm	\N	cerrado	\N	\N	2026-03-10 01:35:21.984	2026-03-10 01:35:21.984
cmmjxucgf0007ib0g8nmvt5gx	cmmjxucga0005ib0gcl8yoofq	\N	cerrado	\N	\N	2026-03-10 01:35:22	2026-03-10 01:35:22
cmm47wusm0002ibr8iv2c5rgs	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Claro, te cuento sobre **Pewmafe**, nuestro departamento de 2 ambientes:\n\n**Ubicación:** Punta Perdices 370, a solo 2 cuadras de la playa (bajada La Rinconada)\n\n**Capacidad:** hasta 4 personas\n**Ambientes:** 1 dormitorio con cama matrimonial, living-comedor, cocina equipada, baño completo con bidet\n\n**Comodidades:** aire acondicionado, Smart TV, Wi-Fi, patio individual con parrilla, cochera propia\n\nIncluye ropa de cama y toallas. Check-in 14hs, check-out 10hs.\n\n**Tarifas por noche:** Temporada baja (marzo) $70.000 - Temp. media $90.000 - Temp. alta (verano) $120.000\n\n¿Te interesa para las fechas que consultaste (15 de marzo, 3 personas)? Solo necesito saber cuantas noches te quedarias.	2026-03-07 00:19:49.863	2026-02-27 01:32:56.421	2026-03-07 00:19:49.866
cmmfe4rpw000sibfsj29p5nzn	cmmfe4rpb000qibfsmfzhtggc	\N	cerrado	¡Por supuesto! Te voy a contactar con un agente de atención para que te ayude personalmente.\n\nPodés comunicarte directamente por:\n- WhatsApp/Teléfono: +54 2920 561033\n- Email: lasgrutasdepartamentos@gmail.com\n\nUn integrante de nuestro equipo se pondrá en contacto con vos a la brevedad para ayudarte con lo que necesites.	2026-03-06 21:12:34.87	2026-03-06 21:12:31.316	2026-03-09 02:39:04.244
cmmi2yaos00o7ibqcs09s3b0h	cmmi2yao600o5ibqcn1q3136o	\N	cerrado	Hola! ¿Cómo andás? Para abril del 2025 o 2026 necesitás? Te pregunto para chequear la disponibilidad exacta y los precios correspondientes.	2026-03-08 18:22:56.754	2026-03-08 18:22:52.06	2026-03-10 19:19:33.19
cmm47zucq0002ibko6rop674m	cmm47zuc20000ibkolvggq5nv	\N	cerrado	¡Hola! Bienvenido a Las Grutas Departamentos.\n\nTenemos varios departamentos disponibles en Las Grutas, todos equipados con aire acondicionado, Wi-Fi, cocina completa y estacionamiento. Para poder recomendarte la mejor opcion, necesito saber: ¿cuantas personas van a viajar, que fechas tienen pensadas y cuantas noches se van a quedar?\n\nAsi puedo mostrarte las opciones que mejor se ajusten a lo que necesitas.	2026-03-06 21:10:08.308	2026-02-27 01:35:15.818	2026-03-09 02:39:04.364
cmmjxucgv000cib0gevpdavm3	cmmjxucgq000aib0glo8hvcvn	\N	cerrado	\N	\N	2026-03-10 01:35:22.015	2026-03-10 01:35:22.015
cmms0yhfi001vibaglmsege7t	cmm47wurj0000ibr8j9sy0cef	\N	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte? ¿Querés consultar disponibilidad, precios o tenés alguna duda sobre nuestros alojamientos?	2026-03-15 17:24:47.608	2026-03-15 17:24:43.327	2026-03-15 17:24:47.61
cmmhuiau100b5ibqc9li9b45f	cmmhuiatv00b3ibqcqoq0olns	\N	cerrado	¡Hola! Perfecto, te confirmo los datos de tu pre-reserva:\n\n**Departamento:** Luminar Mono\n**Fechas:** 10 al 15 de mayo de 2026 (5 noches)\n**Personas:** 2\n**Precio total:** $325.000 ARS\n\nEl departamento está disponible para esas fechas. ¿Querés proceder con la reserva?	2026-03-08 14:26:32.414	2026-03-08 14:26:28.826	2026-03-10 15:05:10.789
cmmfpdolb0008ibsoz6y72cw7	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Conversacion cerrada	2026-03-07 13:24:39.813	2026-03-07 02:27:22.944	2026-03-07 13:24:39.815
cmmjxuovu00inibk0j6abnvei	cmmjxuovf00ilibk0fv09i4m8	\N	cerrado	Hola! Para darte el precio exacto del departamento LG, necesito saber para qué fechas estás consultando. ¿Para cuándo necesitarías el alojamiento?	2026-03-10 01:35:40.874	2026-03-10 01:35:38.106	2026-03-15 17:22:40.85
cmmhufalm009eibqc5p3syc41	cmmhufale009cibqclnb9dkmm	\N	cerrado	¡Hola! ¿Cómo estás? \n\nPara darte el precio exacto del departamento LG, necesito que me digas para qué fechas lo necesitarías y cuántas personas van a ser. Así te paso el precio que corresponde a esa temporada.	2026-03-08 14:24:12.333	2026-03-08 14:24:08.554	2026-03-10 15:05:10.805
cmmfmjs7j001dib0ccns85ysj	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Conversacion cerrada	2026-03-07 02:27:17.093	2026-03-07 01:08:08.72	2026-03-07 02:27:17.096
cmmhuflfd009libqcfkg4wzv7	cmmhuflf5009jibqc26tsgsoc	\N	cerrado	¡Hola! ¿Cómo andás? En Las Grutas hay muchas actividades para disfrutar:\n\n**Playas y mar**: Podés visitar varias playas como la Principal, La Rinconada, Los Acantilados o Piedras Coloradas. Lo más característico son las grutas naturales en los acantilados. También hay buceo y snorkel en aguas cristalinas donde se ven pulpos, estrellas de mar y nudibranquios.\n\n**Deportes y aventura**: Hay kayak, stand up paddle, pesca embarcada y desde costa, y mountain bike por senderos costeros.\n\n**Naturaleza**: Avistaje de fauna marina como lobos marinos, toninas y ballenas (de junio a diciembre). A 100 km está la Pinguinera de El Condor, la más grande de Sudamérica continental.\n\n**Gastronomía y paseos**: Podés probar rabas, pulpo, mejillones y cordero patagónico. En verano hay vida nocturna con bares, restaurantes sobre la costanera y feria artesanal.\n\n¿Te interesa alguna actividad en particular o querés saber sobre alojamiento para tus fechas?	2026-03-08 14:24:32.326	2026-03-08 14:24:22.586	2026-03-10 15:05:10.818
cmmhuhedv00alibqc69w86wp8	cmmhuhedn00ajibqchflgauwc	\N	cerrado	Lamento muchísimo las demoras en la atención, entiendo perfectamente tu molestia. Voy a escalar tu caso inmediatamente para que un agente se comunique con vos lo antes posible y te brinde la atención que necesitás. \n\nTe pido disculpas nuevamente por la espera. ¿Hay algo urgente con lo que pueda ayudarte mientras tanto?	2026-03-08 14:26:04.92	2026-03-08 14:25:46.772	2026-03-10 15:05:10.831
cmmhughwm00a6ibqcjp5mz1vy	cmmhughwh00a4ibqcy5pnp9fg	\N	cerrado	Perfecto, para 3 personas del 20 al 25 de abril (5 noches) tengo disponibilidad en todos nuestros departamentos:\n\n**Pewmafe** (2 cuadras de la playa): Depto 2 ambientes con patio individual, parrilla, cochera. Total: $350.000 ARS\n\n**Luminar Mono** (2-3 cuadras de la playa): Monoambiente de 35-40m2 con solarium, cochera cubierta. Total: $325.000 ARS\n\n**Luminar 2Amb** (2 cuadras de la playa): Depto 2 ambientes con patio cubierto, parrilla, cochera cubierta. Total: $350.000 ARS\n\n**LG** (2 cuadras de la playa): Depto 2 ambientes de 50m2 con solarium amplio, parrilla, cochera cubierta. Total: $400.000 ARS\n\nTodos tienen aire acondicionado, Wi-Fi, cocina equipada y ropa de cama incluida. ¿Cuál te interesa más?	2026-03-08 14:25:39.321	2026-03-08 14:25:04.679	2026-03-10 15:05:10.842
cmmi2zss700p6ibqccqcx4zup	cmmi2zss100p4ibqce2a2j59h	\N	cerrado	¡Hola! ¿Cómo estás? Te consulto el precio para LG del 10 al 13 de abril para 2 personas.\n\nSon 3 noches en temporada baja, el costo total es de **$240.000 ARS** ($80.000 por noche).\n\nEl departamento LG está a 2 cuadras del mar, tiene capacidad para 4 personas, cuenta con aire acondicionado, Wi-Fi, parrilla en el balcón, estacionamiento cubierto y ropa de cama incluida.\n\n¿Te gustaría reservarlo o necesitás más información?	2026-03-08 18:24:07.648	2026-03-08 18:24:02.167	2026-03-10 19:19:32.938
cmmjxylnc00l8ibk0248ut24f	cmmjxyln700l6ibk032666q79	\N	cerrado	¡Hola! Sí, tenemos disponibilidad en Luminar 2Amb para esas fechas. \n\nPara 2 personas del 28 de abril al 1 de mayo (3 noches), el costo total es de $210.000 ARS ($70.000 por noche en temporada baja).\n\n¿Te gustaría hacer la reserva?	2026-03-10 01:38:44.095	2026-03-10 01:38:40.536	2026-03-15 17:22:40.869
cmmfl7l1k001cibxgkqpexm54	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Conversacion cerrada	2026-03-07 01:08:05.216	2026-03-07 00:30:39.944	2026-03-07 01:08:05.218
cmmjxyau100l1ibk09010zxpw	cmmjxyatr00kzibk0hjbbzz0i	\N	cerrado	Lamentablemente no tenemos disponibilidad en LG para esas fechas (18 al 21 de abril de 2026). \n\n¿Te gustaría que revise disponibilidad para fechas cercanas o preferís consultar por alguno de nuestros otros departamentos que sí tienen lugar para 2 personas en esas fechas?	2026-03-10 01:38:30.147	2026-03-10 01:38:26.521	2026-03-15 17:22:40.802
cmmhui00i00ayibqc8bgh13ar	cmmhui00d00awibqcj7vxfctk	\N	cerrado	¡De nada! Fue un placer ayudarte. Cualquier cosa que necesites, no dudes en escribirnos. ¡Que tengas un excelente día!	2026-03-08 14:26:17.475	2026-03-08 14:26:14.802	2026-03-08 14:26:17.48
cmmi2ywbt00olibqc93rlznim	cmmi2ywba00ojibqcuc49is75	\N	cerrado	¡Hola! ¿Cómo estás? Perfecto, te consulto por 3 noches en nuestro departamento LG (Golfo San Jorge 560, a 2 cuadras del mar).\n\nPara poder verificar la disponibilidad y darte el precio exacto, necesito que me confirmes:\n\n- ¿Para qué fechas querés hospedarte? (fecha de entrada y salida)\n- ¿Para cuántas personas?\n\nAsí puedo chequear si tenemos disponibilidad y pasarte toda la info. ¿Me confirmás esos datos?	2026-03-08 18:23:25.09	2026-03-08 18:23:20.105	2026-03-10 19:19:33.034
cmmh208er005sibakq0jx8hcd	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Conversacion cerrada	2026-03-08 18:13:26.717	2026-03-08 01:08:36.627	2026-03-08 18:13:26.718
cmmjxue1s00igibk06lsjzt0v	cmmjxue1e00ieibk0k50ri504	\N	cerrado	¡Hola! ¿Cómo estás? Bienvenido a Las Grutas Departamentos.\n\n¿En qué puedo ayudarte hoy? ¿Buscás alojamiento para venir a Las Grutas o querés consultar algo en particular?	2026-03-10 01:35:27.026	2026-03-10 01:35:24.064	2026-03-15 17:22:40.824
cmmjxy00b00kuibk0n0m8a1hk	cmmjxy00400ksibk0cxy0cflq	\N	cerrado	Lamentablemente el departamento Pewmafe no tiene disponibilidad para las fechas del 15 al 18 de diciembre de 2026. \n\n¿Te gustaría que te sugiera fechas alternativas cercanas a esas, o preferís consultar por otro de nuestros departamentos que sí tenga disponibilidad en esas fechas?	2026-03-10 01:38:16.096	2026-03-10 01:38:12.491	2026-03-15 17:22:40.838
cmmi2k7qz00n0ibqc8r1dvc3f	cmmi2k7qq00myibqcib3nvdub	\N	cerrado	Conversacion cerrada	2026-03-08 18:13:19.939	2026-03-08 18:11:55.067	2026-03-08 18:13:19.94
cmmjxywiz00lfibk0fgk6q0yn	cmmjxywia00ldibk0imknjq6q	\N	cerrado	¡Hola! Sí, tenemos disponibilidad en Pewmafe para 2 personas del 3 al 6 de mayo de 2026 (3 noches). El precio total sería de $210.000 ARS ($70.000 por noche, temporada baja).\n\n¿Te gustaría que avancemos con la pre-reserva?	2026-03-10 01:39:00.996	2026-03-10 01:38:54.635	2026-03-15 17:22:40.914
cmmjy03su00m9ibk09fnniest	cmmjy03sk00m7ibk01k5grqfw	\N	cerrado	¡Hola! Sí, claro que sí. \n\nPara mostrarte las fotos más adecuadas a lo que buscás, ¿me contás para cuántas personas necesitás el departamento y qué fechas tenés en mente? Así te muestro las opciones que mejor se ajusten a tu estadía.	2026-03-10 01:39:54.518	2026-03-10 01:39:50.718	2026-03-15 17:22:40.932
cmmi303mn00pdibqc0174pa89	cmmi303m900pbibqcb10lwr4a	\N	cerrado	[3 fotos de Pewmafe]	2026-03-08 18:24:17.063	2026-03-08 18:24:16.223	2026-03-10 19:19:33.108
cmmhug73n009zibqcr17dczrr	cmmhug73a009xibqczc8efzhk	\N	cerrado	¡Hola! Claro, te cuento sobre el departamento LG.\n\nEs un departamento de 2 ambientes de 50 m², ubicado en Golfo San Jorge 560, a solo 2 cuadras del mar (bajada Los Acantilados). Tiene capacidad para hasta 4 personas, con 1 dormitorio y 1 baño.\n\nEn cuanto a amenities, cuenta con: aire acondicionado, TV LED, Wi-Fi, cable TV, cocina equipada con heladera y microondas, solarium con ventanales amplios, parrilla, estacionamiento cubierto dentro del complejo y ropa de cama incluida (las toallas NO están incluidas).\n\n¿Para cuántas personas y qué fechas lo necesitarías?	2026-03-08 14:24:56.362	2026-03-08 14:24:50.675	2026-03-10 15:05:10.864
cmmhufw8y009sibqcgjgnjb7q	cmmhufw8r009qibqc0iwr3hh3	\N	cerrado	Hola, ¿cómo estás? Gracias por tu consulta.\n\nEl departamento Pewmafe está disponible para esas fechas, pero te comento que requiere una estadía mínima de 2 noches en temporada baja. ¿Podrías quedarte una noche más? Serían 2 noches a $70.000 por noche, total $140.000.\n\n¿Para cuántas personas sería la reserva?	2026-03-08 14:24:40.439	2026-03-08 14:24:36.61	2026-03-10 15:05:10.875
cmmjxuzpc00iuibk03i3hhckm	cmmjxuzp600isibk0jom5ljhc	\N	cerrado	¡Perfecto! Para poder ayudarte con la reserva para abril, necesito que me cuentes un par de cosas:\n\n¿Para cuántas personas es la estadía?	2026-03-10 01:35:54.875	2026-03-10 01:35:52.129	2026-03-15 17:22:40.889
cmmi2zhyv00ozibqcdwo3vzpy	cmmi2zhyn00oxibqc357ih8cr	\N	cerrado	Hola! Gracias por contactarte con Las Grutas Departamentos.\n\nVeo que querés reservar el departamento LG para 2 personas, pero hay un detalle con las fechas: me indicás del 20 al 15 de mayo, y la fecha de salida (15) es anterior a la de entrada (20). ¿Podrías confirmarme las fechas correctas? Por ejemplo, ¿es del 15 al 20 de mayo, o del 20 al 25 de mayo?\n\nUna vez que me confirmes, te paso el precio total y los pasos para confirmar tu reserva.	2026-03-08 18:23:54.274	2026-03-08 18:23:48.151	2026-03-10 19:19:33.076
cmmfk8ffv000bibb0mu2ce1i1	cmmfk8ffb0009ibb0ihtfknqb	\N	cerrado	¡Hola! Gracias por contactarnos 😊\n\nPara 2 personas en marzo tenemos todas nuestras opciones disponibles, ya que marzo es temporada baja. Las tarifas son super accesibles:\n\n**Opciones disponibles:**\n- **Pewmafe** (2 ambientes): $70.000 por noche\n- **Luminar Monoambiente**: $65.000 por noche  \n- **Luminar 2 Ambientes**: $70.000 por noche\n- **Departamentos LG** (2 ambientes): $80.000 por noche\n\nTodos incluyen ropa de cama, toallas, Wi-Fi, aire acondicionado y están a 2-3 cuadras de la playa.\n\nPara confirmar disponibilidad exacta, ¿me decís qué fechas tenés pensadas? ¿Fecha de entrada y salida, o cuántas noches querés quedarte?	2026-03-07 00:03:25.659	2026-03-07 00:03:19.723	2026-03-09 02:39:04.282
cmmhudshi008libqcycqtm1or	cmmhudshb008jibqctb6i19q4	\N	cerrado	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Querés consultar disponibilidad, conocer nuestros departamentos o tenés alguna pregunta sobre Las Grutas?	2026-03-08 14:23:06.387	2026-03-08 14:22:58.422	2026-03-10 15:05:10.739
cmmjy27mz00nlibk0lz74wcyc	cmmjy27mm00njibk0bxifskbb	\N	cerrado	Perfecto, te confirmo que Pewmafe está disponible para 3 personas del 8 al 11 de abril de 2026 (3 noches).\n\nEl precio total sigue siendo de **$210.000 ARS** ($70.000 por noche en temporada baja).\n\n¿Querés proceder con la pre-reserva?	2026-03-10 01:41:45.586	2026-03-10 01:41:29.003	2026-03-15 17:22:40.941
cmmi2md3s00nkibqchwucs245	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Conversacion cerrada	2026-03-09 23:53:01.592	2026-03-08 18:13:35.321	2026-03-09 23:53:01.594
cmmhueoz30093ibqc462bn54a	cmmhueoyq0091ibqcqlqz9cgc	\N	cerrado	Hola, gracias por tu consulta. Para 10 personas, necesitarías reservar varios departamentos ya que la capacidad máxima por unidad es de 4 personas.\n\nTe cuento las opciones disponibles para mañana (9 de marzo):\n\n**Pewmafe** ($70.000/noche): Requiere mínimo 2 noches en temporada baja, por lo que no podría ser para 1 sola noche.\n\n**Luminar 2Amb** ($70.000/noche): 1 unidad disponible, hasta 4 personas.\n\n**LG** ($80.000/noche): Tenemos 5 unidades disponibles, cada una hasta 4 personas.\n\n**Luminar Mono** ($65.000/noche): 1 unidad disponible, hasta 3 personas.\n\nPara alojar a las 10 personas podrías combinar, por ejemplo: 2 deptos LG + 1 Luminar 2Amb (total $230.000 la noche), o bien 3 LG (total $240.000). \n\n¿Te gustaría que te arme alguna combinación específica de departamentos?	2026-03-08 14:24:01.898	2026-03-08 14:23:40.527	2026-03-10 15:05:10.774
cmmjxvldj00j8ibk08xkpzqv1	cmmjxvld400j6ibk0pb6h42gs	\N	cerrado	¡Hola! Te confirmo que el departamento LG está disponible para 2 personas del 30 de mayo al 3 de junio de 2026 (4 noches).\n\nEl precio total de la estadía es de $320.000 ARS (corresponde a temporada baja: $80.000 por noche).\n\n¿Te gustaría proceder con la reserva o necesitás más información sobre el departamento?	2026-03-10 01:36:25.046	2026-03-10 01:36:20.215	2026-03-15 17:22:40.952
cmmjxvw7a00jfibk039hx73iq	cmmjxvw6z00jdibk07feomufk	\N	cerrado	¡Hola! Sí, tenemos disponibilidad para 2 personas hoy (10 de marzo).\n\nPara poder chequear bien las opciones, ¿cuántas noches pensaban quedarse?	2026-03-10 01:36:37.399	2026-03-10 01:36:34.246	2026-03-15 17:22:40.965
cmmi2z75900osibqczttky88v	cmmi2z74y00oqibqc8bagcvz9	\N	cerrado	Hola! ¿Cómo estás? \n\nLamentablemente no aceptamos mascotas en ninguno de nuestros departamentos. Entiendo que es importante viajar con tu mascota, pero es una política que aplicamos en todos nuestros alojamientos.\n\n¿Te puedo ayudar con alguna otra consulta sobre disponibilidad o información de los departamentos?	2026-03-08 18:23:38.353	2026-03-08 18:23:34.126	2026-03-10 19:19:33.154
cmmjxx3js00k7ibk0qtu3pwem	cmmjxx3jg00k5ibk0mt31ly8b	\N	cerrado	¡Hola! Bienvenidos a Las Grutas Departamentos. \n\nPerfecto, son 4 personas en total. Para poder ayudarlos con la disponibilidad y precios, ¿para qué fechas están buscando alojamiento y cuántas noches se quedarían?	2026-03-10 01:37:34.321	2026-03-10 01:37:30.424	2026-03-15 17:22:40.975
cmmjy2tak00nwibk0asrizk4h	cmmjy2ta500nuibk09jjwys1m	cmm42k4k90000ib6sdlu1wxym	humano_activo	hola como puedo ayudarte ?	2026-03-10 01:43:51.738	2026-03-10 01:41:57.068	2026-03-10 01:43:51.741
cmmjxz7by00lmibk0puha5b6a	cmmjxz7bn00lkibk0d2fpgad4	\N	cerrado	¡Por supuesto! Un agente de nuestro equipo se va a poner en contacto con vos en breve por este mismo medio.\n\nMientras tanto, si tenes alguna consulta sobre disponibilidad, precios o características de los departamentos, puedo ayudarte. ¿Hay algo que quieras saber?	2026-03-10 01:39:12.212	2026-03-10 01:39:08.638	2026-03-15 17:22:41
cmmi31aw100q5ibqcnl2nqxoj	cmmi31avr00q3ibqcqoc9od2b	\N	cerrado	¡Perfecto! Para 4 personas tengo varias opciones disponibles que se adaptan a tu grupo.\n\nPara poder mostrarte los departamentos disponibles y darte los precios exactos, ¿me podrías decir para qué fechas necesitarían el alojamiento? ¿Cuál sería la fecha de entrada y la fecha de salida?	2026-03-08 18:25:31.091	2026-03-08 18:25:12.289	2026-03-10 19:19:33.255
cmmi327d700qnibqctnfqx9lp	cmmi327cx00qlibqcpnjuwijo	\N	cerrado	¡Perfecto! Te confirmo los datos de tu pre-reserva:\n\n**Departamento:** Luminar Mono\n**Fechas:** 11 al 16 de marzo de 2026 (5 noches)\n**Personas:** 2\n**Precio total:** $325.000 ARS\n\nEl departamento está disponible para esas fechas. ¿Querés proceder con la reserva?	2026-03-08 18:25:58.23	2026-03-08 18:25:54.379	2026-03-10 19:19:33.273
cmmjy40kg00oiibk01aa5an2i	cmmjy40k600ogibk0aih72yt9	\N	cerrado	Perfecto! Te confirmo entonces para LG:\n\n📅 Entrada: 23 de mayo de 2026\n📅 Salida: 26 de mayo de 2026\n👥 2 personas\n🏠 3 noches en LG (2 ambientes, hasta 4 personas, a 2 cuadras del mar)\n\n💰 Precio total: $240.000 ARS ($80.000 por noche - temporada baja)\n\n¿Querés proceder con la pre-reserva?	2026-03-10 01:43:11.451	2026-03-10 01:42:53.152	2026-03-15 17:22:41.008
cmmjxzi5q00lvibk0swiz6joa	cmmjxzi5g00ltibk0ghzlyo33	\N	cerrado	Perfecto! Pewmafe es ideal para 2 personas. Para confirmar disponibilidad y darte el precio exacto, ¿para qué fechas necesitás el alojamiento? Decime la fecha de entrada (check-in) y salida (check-out), o bien desde qué día querés hospedarte.	2026-03-10 01:39:26.944	2026-03-10 01:39:22.67	2026-03-15 17:22:41.021
cmmjxvajm00j1ibk0er476lt1	cmmjxvaj900izibk0igfr4kf5	\N	cerrado	¡Hola! Bienvenidos a Las Grutas Departamentos. \n\nQué bueno que nos contacten para su estadía. Para poder ayudarlos a encontrar el departamento ideal, necesito saber: **¿cuántas personas son en total?**	2026-03-10 01:36:10.591	2026-03-10 01:36:06.178	2026-03-15 17:22:40.989
cmmjxw70z00jmibk054agfyj3	cmmjxw70r00jkibk03dzzxj9y	\N	cerrado	¡Hola! Qué bueno que te interesa el Luminar Mono. Es un monoambiente muy cómodo de 35-40 m², ubicado a solo 2-3 cuadras de la playa (bajada Los Acantilados), con aire acondicionado, Wi-Fi, cocina completa y estacionamiento cubierto. Tiene capacidad para hasta 3 personas.\n\nPara darte más info sobre disponibilidad y precio, ¿para cuántas personas sería y qué fechas tenés pensadas para tu estadía?	2026-03-10 01:36:53.373	2026-03-10 01:36:48.275	2026-03-15 17:22:41.032
cmmjxwhvz00jtibk0vp5z6egh	cmmjxwhvq00jribk09l7t2nhg	\N	cerrado	¡Hola! Sí, tenemos disponibilidad en ambos departamentos para esas fechas.\n\n**Pewmafe** (2 ambientes, a 2 cuadras de la playa): $210.000 ARS total por 3 noches ($70.000 por noche). Tiene patio individual con parrilla y cochera.\n\n**LG** (2 ambientes, a 2 cuadras del mar): $240.000 ARS total por 3 noches ($80.000 por noche). Está en un complejo con estacionamiento cubierto y parrilla.\n\nAmbos son aptos para 2 personas y cuentan con aire acondicionado, Wi-Fi, cocina equipada y ropa de cama incluida. ¿Cuál te interesa más?	2026-03-10 01:37:08.009	2026-03-10 01:37:02.352	2026-03-15 17:22:41.042
cmmju6u2f0007ibc4fha6tzts	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Conversacion cerrada	2026-03-10 00:37:47.546	2026-03-09 23:53:06.231	2026-03-10 00:37:47.548
cmmjxzsz600m2ibk06l00k5wl	cmmjxzsyx00m0ibk0vn1400mr	\N	cerrado	¡Perfecto! Para poder ayudarte con la reserva, necesito saber desde qué fecha querés ingresar. ¿A partir de qué día necesitás el alojamiento?	2026-03-10 01:39:40.286	2026-03-10 01:39:36.691	2026-03-15 17:22:41.056
cmmjy10bs00muibk0ga8oxvne	cmmjy10bg00msibk0q3jnsf51	\N	cerrado	¡Perfecto! El departamento LG es ideal para 2 personas. \n\nPara poder darte el precio exacto y verificar la disponibilidad, necesito que me digas las fechas: ¿cuándo querés llegar y cuándo te irías?	2026-03-10 01:40:35.956	2026-03-10 01:40:32.873	2026-03-15 17:22:41.068
cmmjxwsps00k0ibk07gyjhe8b	cmmjxwspl00jyibk047cff7nh	\N	cerrado	¡Perfecto! Ya tengo las fechas (del 16 al 23 de marzo, 7 noches). Para poder ofrecerte las mejores opciones, necesito saber: **¿cuántas personas van a viajar?**	2026-03-10 01:37:19.797	2026-03-10 01:37:16.385	2026-03-15 17:22:41.1
cmmjy0phm00mnibk0nuubrqux	cmmjy0phe00mlibk0qjride92	\N	cerrado	¡Claro que sí! Las Grutas tiene muy buena oferta gastronómica, especialmente sobre la costanera. Vas a encontrar restaurantes y parrillas que ofrecen especialidades del mar como rabas, pulpo, mejillones y pescados frescos, además de cordero patagónico.\n\nEn la temporada de verano hay mucha vida nocturna con bares y restaurantes abiertos hasta tarde, y también una feria artesanal. Los deptos están a pocas cuadras de la zona comercial y gastronómica, todo muy accesible caminando.\n\n¿Te gustaría que te ayude con algo más sobre tu visita a Las Grutas?	2026-03-10 01:40:24.16	2026-03-10 01:40:18.827	2026-03-15 17:22:41.144
cmmjy4m7j00otibk0y7r90arb	cmmjy4m7b00oribk0lwzqokuw	\N	cerrado	Cambio: ahora somos 4 personas, y las fechas del 2 de junio al 6 de junio	2026-03-10 01:43:35.218	2026-03-10 01:43:21.2	2026-03-15 17:22:41.153
cmmjy57us00p6ibk01uc2zh6i	cmmjy57ug00p4ibk0if2yky0m	\N	cerrado	¿Para cuántas personas querés hacer la reserva? Así puedo mostrarte los departamentos disponibles que se ajusten a tu grupo.	2026-03-10 01:44:05.863	2026-03-10 01:43:49.252	2026-03-15 17:22:41.16
cmmhue3ce008sibqcx3ed614o	cmmhue3c4008qibqc9iuzc1ar	\N	cerrado	¡Perfecto! Te cuento la disponibilidad para 2 personas del 9 al 10 de marzo:\n\n**Opciones disponibles:**\n\n- **Luminar Mono** (monoambiente): $65.000 por noche\n- **Luminar 2Amb** (2 ambientes con parrilla): $70.000 por noche  \n- **LG** (2 ambientes): $80.000 por noche\n\nEl departamento **Pewmafe** requiere mínimo 2 noches para esta fecha, por lo que si querés alojarte ahí tendrías que extender tu estadía.\n\n¿Cuál de estas opciones te interesa? Si querés, te puedo contar más detalles de cada uno para que elijas el que mejor se adapte a lo que buscás.	2026-03-08 14:23:35.88	2026-03-08 14:23:12.494	2026-03-10 15:05:10.853
cmmjvsieb0003ibk0lxix7tv3	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	Perfecto, quedamos en contacto. Cualquier cosa que necesites, estamos por acá. ¡Que tengas un buen día!	2026-03-10 02:17:24.661	2026-03-10 00:37:57.155	2026-03-10 02:17:24.673
cmmjy1b5h00n3ibk0yr7w5i8a	cmmjy1b5900n1ibk0dd5ivrs0	\N	cerrado	Hola! Te respondo tus consultas:\n\n**WiFi:** Sí, todos nuestros departamentos tienen WiFi incluido.\n\n**Mascotas:** No, lamentablemente no se admiten mascotas en ninguno de nuestros alojamientos.\n\n**Parrilla:** Sí, tenemos parrilla disponible. Pewmafe tiene parrilla individual en cada patio, Luminar 2Amb tiene parrilla en el patio cubierto, y LG también cuenta con parrilla. El único que no tiene es Luminar Mono (monoambiente).\n\n¿Para cuántas personas estás buscando y qué fechas tenías pensado?	2026-03-10 01:40:52.236	2026-03-10 01:40:46.901	2026-03-15 17:22:41.191
cmmi30p8t00pribqcmg69mcdt	cmmi30p8n00ppibqc1qse6a9n	\N	cerrado	Hola! ¿Cómo andás? Te cuento que para alojar a 6 personas, tendrían que reservar más de un departamento, ya que nuestras unidades tienen capacidad máxima de 4 personas cada una.\n\nPara el 23 al 26 de marzo (3 noches, temporada baja), tenemos disponibilidad en todos nuestros departamentos. Algunas opciones para 6 personas serían:\n\n• **Opción 1:** 2 departamentos Pewmafe (hasta 4 personas c/u) - $420.000 total ($210.000 cada uno)\n• **Opción 2:** 1 Luminar 2Amb + 1 Luminar Mono (4 + 3 personas) - $405.000 total\n• **Opción 3:** 1 depto LG + 1 Luminar Mono (4 + 3 personas) - $435.000 total\n\nTodos están a 2-3 cuadras de la playa, con cocina equipada, aire acondicionado y Wi-Fi. Los Pewmafe tienen parrilla individual y patio, mientras que los Luminar y LG están en complejos con estacionamiento cubierto.\n\n¿Cuál de estas opciones te resulta más conveniente?	2026-03-08 18:24:52.658	2026-03-08 18:24:44.237	2026-03-10 19:19:33.309
cmmkvj4lq0002iblsaob4pj9l	cmm47wurj0000ibr8j9sy0cef	\N	cerrado	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Te interesa conocer nuestros alojamientos, consultar disponibilidad o hacer una reserva?	2026-03-10 17:18:31.655	2026-03-10 17:18:25.548	2026-03-15 17:22:41.211
cmmjy6f4g00puibk0gd4316nq	cmmjy6f4c00psibk0olgga0vs	\N	cerrado	¡Perfecto! Ya recibí tu DNI (30.123.456) y el comprobante de transferencia.\n\nUn agente va a verificar el pago en breve y te va a enviar la factura por este mismo medio. Una vez que recibas la factura, tu pre-reserva del departamento Pewmafe del 13 al 16 de mayo quedará confirmada.\n\n¿Hay algo más en lo que pueda ayudarte mientras tanto?	2026-03-10 01:45:30.616	2026-03-10 01:44:45.329	2026-03-15 17:22:41.225
cmmjy5thg00pjibk0c8r3fg1e	cmmjy5tgz00phibk0esfut9a9	\N	cerrado	Hola? Hay alguien?	2026-03-10 01:44:31.31	2026-03-10 01:44:17.285	2026-03-15 17:22:41.234
cmmjy1lzl00naibk07uoz0poq	cmmjy1lzb00n8ibk0sj6f7a3s	\N	cerrado	¡Excelente elección! Te resumo la pre-reserva:\n\n**Pewmafe** - 2 ambientes\n- Fechas: 29 de marzo al 1 de abril (3 noches)\n- Personas: 2\n- Precio total: $210.000 ARS\n\nEl departamento tiene dormitorio independiente, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio con parrilla individual y estacionamiento. Está a 2 cuadras de la playa (bajada La Rinconada).\n\n¿Querés proceder con la reserva?	2026-03-10 01:41:19.241	2026-03-10 01:41:00.945	2026-03-15 17:22:41.241
cmmjy3exd00o7ibk0jnaeovn5	cmmjy3ex300o5ibk0yd3moa22	\N	cerrado	Sí, podés pagar la seña del 30% con tarjeta de crédito a través de MercadoPago. Te aclaro que esta opción tiene un recargo del 8% por el costo del servicio.\n\nLa seña sería de $63.000 ARS (30% de $210.000), y con el recargo del 8% quedaría en $68.040 ARS.\n\nEl saldo restante de $147.000 ARS se abona por transferencia bancaria al momento del check-in.\n\n¿Querés que te pase el link de pago de MercadoPago?	2026-03-10 01:42:44.455	2026-03-10 01:42:25.106	2026-03-15 17:22:41.248
cmmi3102700pyibqcz5d05mwc	cmmi3102100pwibqcbu919bx7	\N	cerrado	¡Perfecto! Te confirmo los datos de tu pre-reserva para el departamento LG:\n\n📋 **Resumen:**\n- Departamento: LG (Golfo San Jorge 560)\n- Entrada: 2 de abril de 2026 a las 13:00 hs\n- Salida: 5 de abril de 2026 a las 24:00 hs\n- Duración: 3 noches\n- Personas: 2\n- **Precio total: $240.000 ARS**\n\nEl departamento tiene capacidad para 4 personas, 1 dormitorio, baño completo, cocina equipada, aire acondicionado, Wi-Fi, parrilla y está a solo 2 cuadras del mar.\n\n¿Querés proceder con la reserva?	2026-03-08 18:25:05.787	2026-03-08 18:24:58.255	2026-03-10 19:19:33.329
cmmi31wjx00qgibqc1kravy61	cmmi31wje00qeibqc4jvi4qo5	\N	cerrado	Hola! Gracias por tu consulta.\n\nTe comento que el departamento Pewmafe para esas fechas (temporada alta) requiere una estadía mínima de 3 noches. ¿Te gustaría extender tu estadía hasta el 18 de enero? Así podríamos concretar la reserva.\n\nSi preferís quedarte solo 1 noche, puedo consultar disponibilidad en otros departamentos que no tienen ese requisito de estadía mínima para esas fechas.\n\n¿Qué preferís?	2026-03-08 18:25:45.694	2026-03-08 18:25:40.365	2026-03-10 19:19:33.345
cmmjxxp7800knibk0o21saza7	cmmjxxp6z00klibk0ju398pts	\N	cerrado	Hola! Tenemos disponibilidad para esas fechas (del 8 al 11 de mayo, 3 noches). Te cuento las opciones para 1 persona:\n\n- **Pewmafe** (2 amb, a 2 cuadras de la playa): $210.000 total\n- **Luminar Mono** (monoambiente, a 2-3 cuadras): $195.000 total\n- **Luminar 2Amb** (2 amb, a 2 cuadras): $210.000 total\n- **LG** (2 amb, a 2 cuadras del mar): $240.000 total\n\nTodos incluyen ropa de cama, Wi-Fi, aire acondicionado y estacionamiento. ¿Cuál te interesa conocer más o te gustaría reservar?	2026-03-10 01:38:04.226	2026-03-10 01:37:58.484	2026-03-15 17:22:40.777
cmmjxxee800keibk04ffus448	cmmjxxedj00kcibk0y4lwiixh	\N	cerrado	Perfecto! Te resumo los datos de tu pre-reserva:\n\n**Departamento:** Luminar 2Amb\n**Fechas:** 23 al 26 de abril de 2026 (3 noches)\n**Personas:** 4\n**Precio total:** $210.000 ARS\n\n¿Querés proceder con la reserva? Para confirmarla necesitamos una seña del 30% ($63.000 ARS). El saldo restante ($147.000 ARS) se abona al momento del check-in.	2026-03-10 01:37:49.13	2026-03-10 01:37:44.48	2026-03-15 17:22:41.173
cmmjy7mho00qdibk0guca83sn	cmmjy7mh300qbibk0oyhad6et	\N	cerrado	Dale, sin problema! Tomá tu tiempo para pensarlo. Cualquier duda que tengas sobre el Pewmafe o las fechas, acá estamos para ayudarte.\n\n¡Que tengas un buen día!	2026-03-10 01:47:50.702	2026-03-10 01:45:41.532	2026-03-10 01:47:50.712
cmmi30efn00pkibqchm5c720j	cmmi30efg00piibqcoplapfnk	\N	cerrado	¡Perfecto! Te confirmo los datos de tu reserva:\n\n**Departamento:** Luminar 2Amb\n**Fecha de entrada:** 28 de marzo de 2026\n**Fecha de salida:** 31 de marzo de 2026\n**Noches:** 3\n**Personas:** 3\n**Precio total:** $210.000 ARS ($70.000 por noche)\n\nEl departamento está disponible para esas fechas. ¿Querés proceder con la pre-reserva?	2026-03-08 18:24:34.104	2026-03-08 18:24:30.227	2026-03-10 19:19:33.224
cmmi2ylhz00oeibqcdpy0g9gp	cmmi2ylhl00ocibqcpxg0qfr1	\N	cerrado	¡Hola! ¿Cómo estás? Gracias por comunicarte con Las Grutas Departamentos.\n\nTe comento que no contamos con un departamento llamado "Premium Suite" en nuestro alojamiento. Tenemos 4 opciones disponibles: **Pewmafe** (dpto 2 ambientes), **Luminar Mono** (monoambiente), **Luminar 2Amb** (dpto 2 ambientes) y **LG** (dpto 2 ambientes).\n\n¿Para cuántas personas necesitás el alojamiento y para qué fechas? Así puedo mostrarte las opciones que mejor se adapten a tus necesidades.	2026-03-08 18:23:12.418	2026-03-08 18:23:06.071	2026-03-10 19:19:33.29
cmmjy0emu00mgibk0n9ju1era	cmmjy0emj00meibk0v77z11xq	\N	cerrado	¡Hola! Te cuento las opciones para llegar desde Buenos Aires a Las Grutas:\n\n**En auto**: Son aproximadamente 1.000 km por Ruta Nacional 3. El viaje dura entre 10-12 horas. Podes hacer paradas en Bahía Blanca o Carmen de Patagones.\n\n**En micro**: Hay varias empresas que hacen el recorrido directo desde Retiro hasta Las Grutas (Don Otto, Cóndor Estrella, entre otras). El viaje dura unas 14-16 horas. Te recomiendo consultar horarios y comprar pasajes con anticipación, especialmente en temporada alta.\n\n**En avión**: Podes volar de Buenos Aires a Viedma (aeropuerto más cercano, a 100 km de Las Grutas). Desde ahí, hay traslados en combi/remis que te llevan directo a Las Grutas en aproximadamente 1 hora.\n\n¿Te puedo ayudar en algo más sobre tu viaje o con información de nuestros departamentos?	2026-03-10 01:40:12.848	2026-03-10 01:40:04.758	2026-03-15 17:22:41.132
\.


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.huespedes (id, wa_id, nombre, telefono, email, notas, creado_en, actualizado_en) FROM stdin;
cmm47wurj0000ibr8j9sy0cef	5491155550000	Simulador	\N	\N	\N	2026-02-27 01:32:56.382	2026-02-27 01:32:56.382
cmm47zuc20000ibkolvggq5nv	5491100001111	Simulador	\N	\N	\N	2026-02-27 01:35:15.794	2026-02-27 01:35:15.794
cmm47zv7p0007ibkouzt5q59b	5491100002222	Simulador	\N	\N	\N	2026-02-27 01:35:16.933	2026-02-27 01:35:16.933
cmmfe3320000cibfshscv0ttp	5491100003333	Test User 3	\N	\N	\N	2026-03-06 21:11:12.697	2026-03-06 21:11:12.697
cmmfe4dhf000jibfsl28r6pk8	5491100004444	Test User 4	\N	\N	\N	2026-03-06 21:12:12.867	2026-03-06 21:12:12.867
cmmfe4rpb000qibfsmfzhtggc	5491100005555	Test User 5	\N	\N	\N	2026-03-06 21:12:31.296	2026-03-06 21:12:31.296
cmmfe5pm9000zibfsnc6jxmb4	5491100006666	Test User 6	\N	\N	\N	2026-03-06 21:13:15.249	2026-03-06 21:13:15.249
cmmfe6kqb001aibfs8ehta4z5	5491100007777	Test User 7	\N	\N	\N	2026-03-06 21:13:55.571	2026-03-06 21:13:55.571
cmmfe994k0000ibrwbidpk1ey	5491100008888	Test Fotos	\N	\N	\N	2026-03-06 21:16:00.501	2026-03-06 21:16:00.501
cmmfehcs90000ib2wbslf3zjs	5491100009999	Test Fix	\N	\N	\N	2026-03-06 21:22:18.49	2026-03-06 21:22:18.49
cmmfh2d900000ibfk90lto4ln	5491100010101	Test Direct	\N	\N	\N	2026-03-06 22:34:38.1	2026-03-06 22:34:38.1
cmmfk7onq0002ibb0jszs6vgw	5491100020202	Test Capacidad	\N	\N	\N	2026-03-07 00:02:45.014	2026-03-07 00:02:45.014
cmmfk8ffb0009ibb0ihtfknqb	5491100030303	Test 2pers	\N	\N	\N	2026-03-07 00:03:19.703	2026-03-07 00:03:19.703
cmmfk9vtr000kibb0xe2tl79t	5491100040404	Test Fotos2	\N	\N	\N	2026-03-07 00:04:27.615	2026-03-07 00:04:27.615
cmmfkf8pw0000ibxgw2dt3ur2	5491100050505	Test Conv	\N	\N	\N	2026-03-07 00:08:37.605	2026-03-07 00:08:37.605
cmmi2z74y00oqibqc8bagcvz9	5491100030004	Test Mascotas	\N	\N	\N	2026-03-08 18:23:34.114	2026-03-08 18:23:34.114
cmmi2zhyn00oxibqc357ih8cr	5491100030005	Test Invertidas	\N	\N	\N	2026-03-08 18:23:48.144	2026-03-08 18:23:48.144
cmmi2zss100p4ibqce2a2j59h	5491100030006	Test PrecioFechas	\N	\N	\N	2026-03-08 18:24:02.161	2026-03-08 18:24:02.161
cmmi303m900pbibqcb10lwr4a	5491100030007	Test URLs	\N	\N	\N	2026-03-08 18:24:16.21	2026-03-08 18:24:16.21
cmmi30efg00piibqcoplapfnk	5491100030008	Test Confirma	\N	\N	\N	2026-03-08 18:24:30.22	2026-03-08 18:24:30.22
cmmi30p8n00ppibqc1qse6a9n	5491100030009	Test Unidades	\N	\N	\N	2026-03-08 18:24:44.231	2026-03-08 18:24:44.231
cmmi3102100pwibqcbu919bx7	5491100030010	Test MercadoPago	\N	\N	\N	2026-03-08 18:24:58.249	2026-03-08 18:24:58.249
cmmi31avr00q3ibqcqoc9od2b	5491100030011	Test CambioPersonas	\N	\N	\N	2026-03-08 18:25:12.28	2026-03-08 18:25:12.28
cmmi31wje00qeibqc4jvi4qo5	5491100030012	Test MinStay	\N	\N	\N	2026-03-08 18:25:40.347	2026-03-08 18:25:40.347
cmmi327cx00qlibqcpnjuwijo	5491100030013	Test BankData	\N	\N	\N	2026-03-08 18:25:54.37	2026-03-08 18:25:54.37
cmmjxuzp600isibk0jom5ljhc	5491100040003	QA-S03	\N	\N	\N	2026-03-10 01:35:52.122	2026-03-10 01:35:52.122
cmmjxvaj900izibk0igfr4kf5	5491100040004	QA-S04	\N	\N	\N	2026-03-10 01:36:06.165	2026-03-10 01:36:06.165
cmmjxvld400j6ibk0pb6h42gs	5491100040007	QA-S07	\N	\N	\N	2026-03-10 01:36:20.2	2026-03-10 01:36:20.2
cmmjxvw6z00jdibk07feomufk	5491100040008	QA-S08	\N	\N	\N	2026-03-10 01:36:34.235	2026-03-10 01:36:34.235
cmmjxw70r00jkibk03dzzxj9y	5491100040009	QA-S09	\N	\N	\N	2026-03-10 01:36:48.267	2026-03-10 01:36:48.267
cmmjxwhvq00jribk09l7t2nhg	5491100040010	QA-S10	\N	\N	\N	2026-03-10 01:37:02.343	2026-03-10 01:37:02.343
cmmjxwspl00jyibk047cff7nh	5491100040011	QA-S11	\N	\N	\N	2026-03-10 01:37:16.377	2026-03-10 01:37:16.377
cmmjxx3jg00k5ibk0mt31ly8b	5491100040012	QA-S12	\N	\N	\N	2026-03-10 01:37:30.412	2026-03-10 01:37:30.412
cmmjxxedj00kcibk0y4lwiixh	5491100040013	QA-S13	\N	\N	\N	2026-03-10 01:37:44.456	2026-03-10 01:37:44.456
cmmjxxp6z00klibk0ju398pts	5491100040014	QA-S14	\N	\N	\N	2026-03-10 01:37:58.475	2026-03-10 01:37:58.475
cmmjxy00400ksibk0cxy0cflq	5491100040015	QA-S15	\N	\N	\N	2026-03-10 01:38:12.485	2026-03-10 01:38:12.485
cmmjxyatr00kzibk0hjbbzz0i	5491100040016	QA-S16	\N	\N	\N	2026-03-10 01:38:26.512	2026-03-10 01:38:26.512
cmmjxyln700l6ibk032666q79	5491100040017	QA-S17	\N	\N	\N	2026-03-10 01:38:40.532	2026-03-10 01:38:40.532
cmmgo25280000ibakdi85n4i5	5491100000001	TestBot	\N	\N	\N	2026-03-07 18:38:10.976	2026-03-08 01:57:25.487
cmmhudshb008jibqctb6i19q4	5491100010001	Maria Lopez	\N	\N	\N	2026-03-08 14:22:58.415	2026-03-08 14:22:58.415
cmmhue3c4008qibqc9iuzc1ar	5491100010002	Carlos Diaz	\N	\N	\N	2026-03-08 14:23:12.484	2026-03-08 14:23:12.484
cmmhueoyq0091ibqcqlqz9cgc	5491100010003	Pedro Martinez	\N	\N	\N	2026-03-08 14:23:40.514	2026-03-08 14:23:40.514
cmmhufale009cibqclnb9dkmm	5491100010004	Ana Garcia	\N	\N	\N	2026-03-08 14:24:08.547	2026-03-08 14:24:08.547
cmmhuflf5009jibqc26tsgsoc	5491100010005	Laura Fernandez	\N	\N	\N	2026-03-08 14:24:22.577	2026-03-08 14:24:22.577
cmmhufw8r009qibqc0iwr3hh3	5491100010006	Roberto Sosa	\N	\N	\N	2026-03-08 14:24:36.603	2026-03-08 14:24:36.603
cmmhug73a009xibqczc8efzhk	5491100010007	Sofia Ruiz	\N	\N	\N	2026-03-08 14:24:50.663	2026-03-08 14:24:50.663
cmmhughwh00a4ibqcy5pnp9fg	5491100010008	Diego Morales	\N	\N	\N	2026-03-08 14:25:04.673	2026-03-08 14:25:04.673
cmmhuhedn00ajibqchflgauwc	5491100010009	Marta Gimenez	\N	\N	\N	2026-03-08 14:25:46.764	2026-03-08 14:25:46.764
cmmhui00d00awibqcj7vxfctk	5491100010010	Juan Perez	\N	\N	\N	2026-03-08 14:26:14.798	2026-03-08 14:26:14.798
cmmhuiatv00b3ibqcqoq0olns	5491100010011	Lucia Torres	\N	\N	\N	2026-03-08 14:26:28.819	2026-03-08 14:26:28.819
cmmjxywia00ldibk0imknjq6q	5491100040018	QA-S18	\N	\N	\N	2026-03-10 01:38:54.611	2026-03-10 01:38:54.611
cmmjxz7bn00lkibk0d2fpgad4	5491100040019	QA-S19	\N	\N	\N	2026-03-10 01:39:08.627	2026-03-10 01:39:08.627
cmmjxzi5g00ltibk0ghzlyo33	5491100040023	QA-S23	\N	\N	\N	2026-03-10 01:39:22.66	2026-03-10 01:39:22.66
cmmjxzsyx00m0ibk0vn1400mr	5491100040024	QA-S24	\N	\N	\N	2026-03-10 01:39:36.681	2026-03-10 01:39:36.681
cmmjy03sk00m7ibk01k5grqfw	5491100040027	QA-S27	\N	\N	\N	2026-03-10 01:39:50.709	2026-03-10 01:39:50.709
cmmjy0emj00meibk0v77z11xq	5491100040028	QA-S28	\N	\N	\N	2026-03-10 01:40:04.748	2026-03-10 01:40:04.748
cmmjy0phe00mlibk0qjride92	5491100040029	QA-S29	\N	\N	\N	2026-03-10 01:40:18.818	2026-03-10 01:40:18.818
cmmjy10bg00msibk0q3jnsf51	5491100040031	QA-S31	\N	\N	\N	2026-03-10 01:40:32.861	2026-03-10 01:40:32.861
cmmjy1b5900n1ibk0dd5ivrs0	5491100040033	QA-S33	\N	\N	\N	2026-03-10 01:40:46.894	2026-03-10 01:40:46.894
cmmjy1lzb00n8ibk0sj6f7a3s	5491100040005	QA-S05	\N	\N	\N	2026-03-10 01:41:00.935	2026-03-10 01:41:00.935
cmmjy27mm00njibk0bxifskbb	5491100040006	QA-S06	\N	\N	\N	2026-03-10 01:41:28.991	2026-03-10 01:41:28.991
cmmjy2ta500nuibk09jjwys1m	5491100040020	QA-S20	\N	\N	\N	2026-03-10 01:41:57.053	2026-03-10 01:41:57.053
cmmjy3ex300o5ibk0yd3moa22	5491100040022	QA-S22	\N	\N	\N	2026-03-10 01:42:25.096	2026-03-10 01:42:25.096
cmmjy40k600ogibk0aih72yt9	5491100040025	QA-S25	\N	\N	\N	2026-03-10 01:42:53.142	2026-03-10 01:42:53.142
cmmjy4m7b00oribk0lwzqokuw	5491100040026	QA-S26	\N	\N	\N	2026-03-10 01:43:21.191	2026-03-10 01:43:21.191
cmmjy57ug00p4ibk0if2yky0m	5491100040032	QA-S32	\N	\N	\N	2026-03-10 01:43:49.241	2026-03-10 01:43:49.241
cmmjy5tgz00phibk0esfut9a9	5491100040034	QA-S34	\N	\N	\N	2026-03-10 01:44:17.268	2026-03-10 01:44:17.268
cmmjy6f4c00psibk0olgga0vs	5491100040021	QA-S21	\N	\N	\N	2026-03-10 01:44:45.324	2026-03-10 01:44:45.324
cmmjy7mh300qbibk0oyhad6et	5491100040030	QA-S30	\N	\N	\N	2026-03-10 01:45:41.511	2026-03-10 01:45:41.511
cmmi2k7qq00myibqcib3nvdub	5491188880001	Test Error Grave	\N	\N	\N	2026-03-08 18:11:55.058	2026-03-08 18:11:55.058
cmmi2yao600o5ibqcn1q3136o	5491100030001	Test Capacidad	\N	\N	\N	2026-03-08 18:22:52.039	2026-03-08 18:22:52.039
cmmi2ylhl00ocibqcpxg0qfr1	5491100030002	Test Inexistente	\N	\N	\N	2026-03-08 18:23:06.058	2026-03-08 18:23:06.058
cmmi2ywba00ojibqcuc49is75	5491100030003	Test Noches	\N	\N	\N	2026-03-08 18:23:20.086	2026-03-08 18:23:20.086
cmmjxucft0000ib0grh45u3tm	5491100049016	Setup QA-S16	\N	\N	\N	2026-03-10 01:35:21.977	2026-03-10 01:35:21.977
cmmjxucga0005ib0gcl8yoofq	5491100049017	Setup QA-S17	\N	\N	\N	2026-03-10 01:35:21.995	2026-03-10 01:35:21.995
cmmjxucgq000aib0glo8hvcvn	5491100049018	Setup QA-S18	\N	\N	\N	2026-03-10 01:35:22.01	2026-03-10 01:35:22.01
cmmjxue1e00ieibk0k50ri504	5491100040001	QA-S01	\N	\N	\N	2026-03-10 01:35:24.051	2026-03-10 01:35:24.051
cmmjxuovf00ilibk0fv09i4m8	5491100040002	QA-S02	\N	\N	\N	2026-03-10 01:35:38.091	2026-03-10 01:35:38.091
\.


--
-- Data for Name: inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario (id, fecha, habitacion, disponible, precio, notas) FROM stdin;
cmmfawwkw00vbibns39pwdpg4	2026-04-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwl800vcibnswrefl07l	2026-04-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwlf00vdibns0jxkvwuw	2026-04-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwlm00veibnsybkmen4i	2026-04-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwlv00vfibns8vd694n8	2026-04-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwlz00vgibnswujfjyaz	2026-04-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwm200vhibnst47sdy2j	2026-04-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwm600viibnsgqhjcj62	2026-04-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwm900vjibns68btkqxr	2026-04-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwmd00vkibns5t7qfilu	2026-04-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwmi00vlibnsy2u1bpgl	2026-04-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwmo00vmibns05ocdtxx	2026-04-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwmu00vnibnsf812jc3m	2026-04-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwmy00voibnsgyn6gs7z	2026-04-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwn200vpibns9e2gzrqj	2026-04-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwn800vqibnstlr2toie	2026-04-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwnc00vribnsseg939ul	2026-04-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwnh00vsibnsqgouag40	2026-04-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwnk00vtibnsujvp51dv	2026-04-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwno00vuibns0y7t6lk7	2026-04-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwnt00vvibnsp1uhzx3p	2026-04-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwnx00vwibnsaafm9ubg	2026-04-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwo100vxibnsfgf8jj4u	2026-04-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwo500vyibnsb0lesuu4	2026-04-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwoa00vzibnsh8xbkdxd	2026-05-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwoe00w0ibns1bh9k8bi	2026-05-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwoi00w1ibnsrjz8tewv	2026-05-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwol00w2ibnsr5v0dm32	2026-05-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwop00w3ibnsrasdhs63	2026-05-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwot00w4ibns9umgrit6	2026-05-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwoz00w5ibnscdw329p7	2026-05-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwp500w6ibns7p959wmp	2026-05-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwpb00w7ibnsucu0asew	2026-05-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwpf00w8ibnsd3n419w4	2026-05-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwpk00w9ibns3fo0ylp7	2026-05-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwpp00waibnsuce9h14y	2026-05-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwpv00wbibnsnedi6dwp	2026-05-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwq000wcibnsju3wthqn	2026-05-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwq400wdibnsevarhqyv	2026-05-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwqa00weibnslryglg0v	2026-05-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwqe00wfibns54j84lru	2026-05-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwqj00wgibnslx57f74k	2026-05-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwqp00whibnsoqodmtst	2026-05-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwqv00wiibnsol8tgcds	2026-05-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwr000wjibnsm14h904u	2026-05-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwr600wkibns7z9yf1vu	2026-05-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwra00wlibnsztj6inws	2026-05-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwrf00wmibnsqv8m52cg	2026-05-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwrl00wnibns5876e6ds	2026-05-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwrr00woibns1mt19r92	2026-05-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawws000wpibnsvg48mfov	2026-05-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwsa00wqibnsnuq80h3a	2026-05-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwsk00wribnshnmwpkvj	2026-05-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwso00wsibns94yqh7zi	2026-05-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwss00wtibns2uv6n2ct	2026-05-31 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwsw00wuibns5t0np0gl	2026-06-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwt000wvibnsihgrcgos	2026-06-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwt400wwibnsxmuei0uf	2026-06-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwte00wxibnslqautdv5	2026-06-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwtn00wyibnsoeduatu6	2026-06-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwtq00wzibnshrhlmjog	2026-06-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwtt00x0ibnspd7noc3k	2026-06-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwtw00x1ibnsbaqgqh7i	2026-06-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwty00x2ibnsmcmllcik	2026-06-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwu100x3ibnsx02n8c6v	2026-06-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwu600x4ibns801oafj6	2026-06-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwu900x5ibnsx0h5a8ar	2026-06-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuc00x6ibnsvcw79ira	2026-06-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuf00x7ibnssk6wdvoq	2026-06-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuh00x8ibnst46udspg	2026-06-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuk00x9ibnsdpp8i9d1	2026-06-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwun00xaibnsqcthf2vr	2026-06-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuq00xbibnsnlvsythw	2026-06-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwut00xcibnsivbhltpt	2026-06-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuw00xdibnsoe061ihz	2026-06-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwuz00xeibnsevu7gi6o	2026-06-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwv200xfibns5r0klssp	2026-06-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwv500xgibnsy2n1jj1f	2026-06-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwv800xhibnsmz94g16z	2026-06-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwvb00xiibnst8dgrppc	2026-06-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwve00xjibns1c19dkid	2026-06-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwvh00xkibnsbjxeczvb	2026-06-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwvk00xlibnsg8zg92x9	2026-06-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwvn00xmibnsh8wyf1ge	2026-06-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwvp00xnibnsq5xxa18l	2026-06-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwvr00xoibnsq5khl2h5	2026-07-01 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwvt00xpibnsakw55qr2	2026-07-02 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwvw00xqibnsj4oy04yc	2026-07-03 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwvz00xribnsg7fy5k23	2026-07-04 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawww200xsibnscyzb6j3w	2026-07-05 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawww600xtibns7u4lsjqn	2026-07-06 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawww900xuibnszhkl0bxr	2026-07-07 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwd00xvibnseq2d45cq	2026-07-08 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwf00xwibnsp797db0w	2026-07-09 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwh00xxibns4hchwnw9	2026-07-10 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwk00xyibns5nq76s1e	2026-07-11 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwn00xzibnslco3gjid	2026-07-12 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwq00y0ibnsjmq1as1w	2026-07-13 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwt00y1ibnsjyogy5sj	2026-07-14 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwv00y2ibnsdczi4jbk	2026-07-15 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwx00y3ibnsm6ut6qcn	2026-07-16 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwwz00y4ibnsxjjro2pn	2026-07-17 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwx200y5ibnsvpjuzrw5	2026-07-18 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwx500y6ibnsz52uc9uo	2026-07-19 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwx800y7ibnsmil4p1ny	2026-07-20 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxc00y8ibnstogb3eum	2026-07-21 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxe00y9ibnsq38xktrn	2026-07-22 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxh00yaibnsrczpcua0	2026-07-23 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxk00ybibnsp0fpren2	2026-07-24 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxn00ycibnseewpl41d	2026-07-25 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxq00ydibnszz3xfkdk	2026-07-26 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxt00yeibns7swwu6it	2026-07-27 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxw00yfibnsbshiyomv	2026-07-28 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwxz00ygibnsnnwpbwek	2026-07-29 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwy200yhibnsa11mriv1	2026-07-30 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwy500yiibns18mylx5i	2026-07-31 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawwy800yjibnsceq79098	2026-08-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyc00ykibnscfcotl0p	2026-08-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwye00ylibns7p1s5oel	2026-08-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyh00ymibnsjdzyytga	2026-08-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyl00ynibns22ro6r7p	2026-08-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyo00yoibnscjbkb1hy	2026-08-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyr00ypibnsp4ci0hjz	2026-08-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyu00yqibnsw23tetnr	2026-08-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwyx00yribnsygr8adn8	2026-08-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwz000ysibnsz01yinr0	2026-08-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwz200ytibnsrplyj2y3	2026-08-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwz400yuibns9sraczxq	2026-08-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwz600yvibnswz3d9eez	2026-08-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwz900ywibnsdvjdm96o	2026-08-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzb00yxibnsjnu07q6d	2026-08-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzd00yyibns5b910yq5	2026-08-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzh00yzibnsev3bntkr	2026-08-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzk00z0ibnsj5i2jtb1	2026-08-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzo00z1ibnsy9bzzd49	2026-08-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzr00z2ibnsr7ruedwh	2026-08-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzu00z3ibns9p379iw9	2026-08-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwzx00z4ibns75bntu2w	2026-08-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0000z5ibnspr7f5fhh	2026-08-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0300z6ibnsb8ih31sk	2026-08-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0500z7ibnszwiyisgc	2026-08-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0800z8ibns68f3o32n	2026-08-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0b00z9ibnsfax3aqna	2026-08-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0e00zaibnsly5ewl11	2026-08-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0h00zbibnscbglhe3c	2026-08-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0k00zcibnsflaa6h7v	2026-08-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0m00zdibnszr3a13sh	2026-08-31 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0r00zeibnsjdb11m3g	2026-09-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0v00zfibnsksdmfrgt	2026-09-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx0z00zgibnselli32uh	2026-09-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1200zhibnstodhdxij	2026-09-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1500ziibns2wjzedno	2026-09-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1800zjibns9ba0zyei	2026-09-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1a00zkibnssbspdk4t	2026-09-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1d00zlibnsxvop5tpf	2026-09-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1f00zmibns4odpxbcz	2026-09-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1i00znibns0r0ebryk	2026-09-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1k00zoibnsb2r4nxn9	2026-09-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1n00zpibns9i0yptp6	2026-09-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1r00zqibns1pbnsd17	2026-09-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1u00zribnsunc0ytw7	2026-09-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx1y00zsibns53of0lc5	2026-09-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2100ztibnsgf8p5fmz	2026-09-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2400zuibnsuzme1dr2	2026-09-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2700zvibnspddi502i	2026-09-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2a00zwibnsrthh8rya	2026-09-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2e00zxibnshr5pcq0v	2026-09-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2k00zyibnsq4hmlvv9	2026-09-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2p00zzibnsz9u3kwff	2026-09-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx2u0100ibnsonu7dyob	2026-09-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx300101ibnsojztkt88	2026-09-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx350102ibnsb4s08mwu	2026-09-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx3a0103ibnswmqh919s	2026-09-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx3f0104ibns4845p89n	2026-09-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx3j0105ibns95odqmh4	2026-09-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx3o0106ibnslgzmkzqi	2026-09-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx3t0107ibns6acyk0ba	2026-09-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx3x0108ibnsravtcg8v	2026-10-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx420109ibnsaamhoaot	2026-10-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx48010aibnsmqvytk92	2026-10-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx4i010bibnsinbbqmhs	2026-10-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx4o010cibnshliy2yh3	2026-10-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx4t010dibnsfotd80mn	2026-10-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx4y010eibns1xi8dno0	2026-10-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx55010fibnsa9vl0jet	2026-10-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx59010gibnsv8zmxce2	2026-10-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx5f010hibns2wz03x8c	2026-10-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx5k010iibnsj1dxh0j1	2026-10-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx5o010jibnsiwia4e2x	2026-10-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx5t010kibns05q1zwo6	2026-10-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx5z010libnsdh3gu5dg	2026-10-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx64010mibns2tvzilcd	2026-10-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx6a010nibnsa1j1qmwb	2026-10-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx6h010oibnsfygdxb3b	2026-10-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx6l010pibns7vn6o5hv	2026-10-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx6o010qibns1q15qizn	2026-10-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx6u010ribns8rl29fbw	2026-10-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx6y010sibnseg92yl5c	2026-10-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx72010tibnsf9540ita	2026-10-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx77010uibnstx281nt4	2026-10-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7b010vibnsglmgpcx7	2026-10-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7f010wibns4z8401rt	2026-10-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7j010xibnsmrw4bn19	2026-10-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7n010yibnsl73hvrlv	2026-10-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7r010zibnsqjxm6syg	2026-10-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7v0110ibnsiy9t6j46	2026-10-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx7z0111ibnsn4wcxuic	2026-10-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx830112ibnszitym8ch	2026-10-31 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx890113ibnshixn740p	2026-11-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx8g0114ibnsmcqe1pvp	2026-11-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx8o0115ibns40opc38r	2026-11-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx8s0116ibns5ieyccue	2026-11-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx8w0117ibnsep6exjg3	2026-11-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx910118ibns488r3o1a	2026-11-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx970119ibns4ks0tncc	2026-11-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx9b011aibnsc5v80sji	2026-11-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx9f011bibnse2a73e8j	2026-11-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx9j011cibnspi4z3m97	2026-11-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx9n011dibns2ya1cwn3	2026-11-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx9r011eibns7hhebc9m	2026-11-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawx9w011fibnsrpyjt56g	2026-11-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxa2011gibnsduuiv5jo	2026-11-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxa7011hibns2j09mar7	2026-11-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxac011iibnsfj6hzcka	2026-11-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxah011jibnso4z4vial	2026-11-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxan011kibnsl5si6ct5	2026-11-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxar011libns1oqpnex7	2026-11-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxaw011mibnsc7wog06x	2026-11-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxb0011nibnspwuf524e	2026-11-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxb4011oibnsthq2zscw	2026-11-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxb8011pibns1vax01t8	2026-11-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxbd011qibns8otuw5oq	2026-11-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxbh011ribnsourze2zu	2026-11-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxbl011sibnso10xy2rx	2026-11-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxbs011tibnszoavtbil	2026-11-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxbx011uibnsvrlzrgke	2026-11-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxc1011vibnsv0wfmoqg	2026-11-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxc6011wibns9pllxuxy	2026-11-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxcb011xibns03ea2j6i	2026-12-01 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxch011yibnsxrbwy08f	2026-12-02 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxcl011zibns184te3l3	2026-12-03 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxcq0120ibnstiyikepc	2026-12-04 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxcv0121ibns1ka41mwi	2026-12-05 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxcy0122ibnsxl7mufrn	2026-12-06 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxd20123ibns3exuc5t6	2026-12-07 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxd70124ibns1gsghab5	2026-12-08 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxdc0125ibnsv090a5or	2026-12-09 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxdi0126ibnslkn6cg0w	2026-12-10 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxdm0127ibnsqfut60gp	2026-12-11 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxdr0128ibnsk8aqc061	2026-12-12 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxdu0129ibnstptgcyuc	2026-12-13 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxdy012aibnscp8kghpw	2026-12-14 03:00:00	LG	t	95000.000000000000000000000000000000	\N
cmmfawxe1012bibnswanhsl0m	2026-12-15 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxe5012cibns284f2xrs	2026-12-16 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxe9012dibnsa47tqo2w	2026-12-17 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxec012eibnsptc57w3l	2026-12-18 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxee012fibnsrf060nuj	2026-12-19 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxei012gibns2ixtvyb2	2026-12-20 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxel012hibnsbdguygv2	2026-12-21 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxep012iibnsvl02230m	2026-12-22 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxes012jibns3xoz8xdo	2026-12-23 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxeu012kibnsota4h8p8	2026-12-24 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxex012libnsiqx4izy9	2026-12-25 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxf1012mibns6wrqy3a2	2026-12-26 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxf4012nibnsde9o6swn	2026-12-27 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxf7012oibns0ezby3vd	2026-12-28 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxf9012pibns9kgex4jr	2026-12-29 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfb012qibnsuo2prz3a	2026-12-30 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfc012ribnsg29rwrc3	2026-12-31 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfe012sibnss3yzyya7	2027-01-01 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxfg012tibnsrg70jaqb	2027-01-02 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfi012uibnsqoyho9je	2027-01-03 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfl012vibns0gtmdl41	2027-01-04 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfn012wibns40gsb89d	2027-01-05 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfp012xibns0tpqydix	2027-01-06 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfs012yibnsqxvcuw0l	2027-01-07 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfv012zibns2g9f0s8f	2027-01-08 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfx0130ibns77rzeoei	2027-01-09 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxfz0131ibns1qi0zhe3	2027-01-10 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxg30132ibnswjm0vnmo	2027-01-11 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxg50133ibnsguup3bx8	2027-01-12 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxg70134ibnsuhgnabpk	2027-01-13 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxg90135ibnsbm4hvf44	2027-01-14 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxgc0136ibnsh5c4f85w	2027-01-15 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxgg0137ibnsx3q4i8md	2027-01-16 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxgk0138ibns168bezu2	2027-01-17 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxgn0139ibnsgd3e3i9q	2027-01-18 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxgr013aibnsstrtx7oj	2027-01-19 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxgy013bibns5w2t7nyr	2027-01-20 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxh3013cibnsfaho77uo	2027-01-21 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxh7013dibns6aw1sejt	2027-01-22 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxhb013eibnsl38fpn3x	2027-01-23 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxhe013fibnsl441mnrc	2027-01-24 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxhl013gibns39a08hlk	2027-01-25 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxhq013hibnsa915xiwf	2027-01-26 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxhu013iibnstfm761jq	2027-01-27 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxhy013jibns4tyz1koz	2027-01-28 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxi3013kibns9wcphxla	2027-01-29 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxi7013libns1psduj2f	2027-01-30 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxic013mibns2198zocs	2027-01-31 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxig013nibnsgs9wbqd8	2027-02-01 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxil013oibnsj3aoilrm	2027-02-02 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxip013pibns27d7tpct	2027-02-03 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxiu013qibnsbz6dxoc7	2027-02-04 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxiy013ribnsi0q21vjx	2027-02-05 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxj4013sibns591mlbf2	2027-02-06 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxj8013tibnsc8gf13m0	2027-02-07 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxje013uibnsdh5115zt	2027-02-08 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxjk013vibns7tnvcudd	2027-02-09 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxjr013wibnszm9tu104	2027-02-10 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxjz013xibnsja5f5vfz	2027-02-11 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxk6013yibnsfthv5x9j	2027-02-12 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxkf013zibnsmvez0s76	2027-02-13 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxkk0140ibns5mggo67i	2027-02-14 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxkp0141ibns8q2l4718	2027-02-15 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxky0142ibnsg8a5tk4v	2027-02-16 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxl20143ibnsbygi89to	2027-02-17 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxl60144ibnsk9h1wvw8	2027-02-18 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxla0145ibnscgs2t461	2027-02-19 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxle0146ibns0oa8jb6l	2027-02-20 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxli0147ibns27lv0ms5	2027-02-21 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxln0148ibnsj74b9gov	2027-02-22 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxlt0149ibnskeog5khw	2027-02-23 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxlw014aibnsp5p7wn7v	2027-02-24 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxlz014bibnszuahm3zt	2027-02-25 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxm5014cibnsgtsl9gi0	2027-02-26 03:00:00	LG	f	130000.000000000000000000000000000000	\N
cmmfawxm8014dibnsdxv52ypc	2027-02-27 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxmb014eibns0idv5tcx	2027-02-28 03:00:00	LG	t	130000.000000000000000000000000000000	\N
cmmfawxmf014fibnsb34erflh	2027-03-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxmi014gibnsinw3ofp4	2027-03-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxml014hibnsb5ikjkqi	2027-03-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxmo014iibnsbg1ktndf	2027-03-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawxmq014jibnskzasiby0	2027-03-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawts5006nibns9wlzxiou	2026-10-31 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawts8006oibnsm8tn5m3y	2026-11-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtsa006pibnscpivdygz	2026-11-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtsd006qibnsokrc0kyd	2026-11-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtou005sibnsku0mlqiw	2026-09-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtp3005tibnsfk89t6c7	2026-10-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtpa005uibnskkdu5ay5	2026-10-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtpg005vibnsyidbutp7	2026-10-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtey0047ibns71eefno8	2026-08-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsq60000ibns7tgnn7jc	2026-03-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsql0001ibnsqvqmot49	2026-03-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsqr0002ibnstneqcu7i	2026-03-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsqv0003ibnsd4q2vju1	2026-03-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsqy0004ibns9gj33tsr	2026-03-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsr40005ibnsvjqjr5z8	2026-03-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsr90006ibnsxx0rhttd	2026-03-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsrf0007ibns34zvp3cj	2026-03-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsrm0008ibnsv7lwrxby	2026-03-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsrr0009ibns1mn38gmf	2026-03-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsru000aibnsillt0yrb	2026-03-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsrz000bibns5ymobol1	2026-03-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawss6000cibnshzmkdvs0	2026-03-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsse000dibnskraspor0	2026-03-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawssn000eibnse7m97d5r	2026-03-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawssu000fibnsupj0buf9	2026-03-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawst1000gibnsh95y4fv2	2026-03-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawst8000hibnsi83sw6ev	2026-03-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsth000iibns42t7r2kw	2026-03-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawstr000jibnsgbjsu8j7	2026-03-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsu1000kibnsj08vc6oa	2026-03-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsub000libns4n9nkkwp	2026-03-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsui000mibnsaqcaepm1	2026-03-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsun000nibnsxlcqlljr	2026-03-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsuy000oibns6fjgt8si	2026-03-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsv6000pibnslfxbt16f	2026-03-31 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsve000qibnskkc77ng1	2026-04-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsvm000ribns1wvw1rfc	2026-04-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsvw000sibnsgt5mvzhf	2026-04-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsw5000tibnspyulyl7a	2026-04-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawswf000uibnsw2z7l1vq	2026-04-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawswo000vibnse10swrew	2026-04-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawswx000wibnsvzmk67pt	2026-04-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsx8000xibns1139tsyd	2026-04-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsxi000yibns9qzrzdto	2026-04-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsxu000zibns6yf7ah9f	2026-04-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsy40010ibnsu1m97kbb	2026-04-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsyd0011ibnsbvrf9umu	2026-04-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsym0012ibnstafwsw7b	2026-04-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsyv0013ibns6rq4mohz	2026-04-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawsz30014ibnsimkkpwpr	2026-04-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawszb0015ibnspxmb3ges	2026-04-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawszj0016ibns39tsbood	2026-04-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawszr0017ibnsdtjculkc	2026-04-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt000018ibns4j4edr92	2026-04-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt080019ibnsafdzxeva	2026-04-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt0g001aibns4i8m2ems	2026-04-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt0n001bibnsb2k11y0z	2026-04-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt0u001cibns3mt6ewub	2026-04-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt10001dibns5gjpv072	2026-04-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt15001eibnswl9utqc1	2026-04-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt1a001fibnsr9h8m5w1	2026-04-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt1e001gibnsleiboyy6	2026-04-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt1k001hibnsuy8z3aaf	2026-04-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt1r001iibnsfdkpqs9m	2026-04-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt1w001jibnsbsv58z6m	2026-04-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt20001kibnstcivvt5e	2026-05-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt24001libns6q3ox4dm	2026-05-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt28001mibnsm986toom	2026-05-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2b001nibnscyk7w4i8	2026-05-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2f001oibns4yqdk7b9	2026-05-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2j001pibnsz4ljf376	2026-05-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2n001qibnsaq8ovl9j	2026-05-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2q001ribnsndw3sfru	2026-05-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2t001sibnse0t8jg9z	2026-05-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2w001tibnshznkf0eh	2026-05-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt2z001uibnsm67s4gcg	2026-05-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt32001vibnslrqollzg	2026-05-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt35001wibnsz0ocufww	2026-05-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt38001xibnsvtae7a9s	2026-05-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3b001yibnsbw2e9tw5	2026-05-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3f001zibns69yinexx	2026-05-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3i0020ibns1oeah8bp	2026-05-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3l0021ibnspmue48vx	2026-05-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3n0022ibnsm3tc6c8r	2026-05-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3q0023ibnsgnqad5u8	2026-05-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3s0024ibnsnxljmhjv	2026-05-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3v0025ibns79zk882o	2026-05-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt3x0026ibns5v9juj0c	2026-05-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt400027ibns9w0n6idr	2026-05-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt430028ibnsl5zstwj9	2026-05-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt470029ibnsi0ct4ti4	2026-05-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4a002aibns6wr5zju9	2026-05-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4e002bibnsdi3godxh	2026-05-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4j002cibns2sfap68o	2026-05-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4n002dibns3xnrl7sf	2026-05-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4q002eibnsfa4bjkt9	2026-05-31 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4u002fibnslom2qvef	2026-06-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt4y002gibnsd32o1id3	2026-06-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt52002hibnsc8nqfqyg	2026-06-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt54002iibnsjs357f7n	2026-06-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt58002jibns8m6xupio	2026-06-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt5b002kibnsrxqvq21d	2026-06-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt5d002libnsg5zttc7l	2026-06-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt5g002mibnsuuzvnuoj	2026-06-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt5k002nibnsw5r8sfyb	2026-06-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt5o002oibns3c0ybrk8	2026-06-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt5v002pibnsqzlnj8a2	2026-06-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt62002qibnsjwqmomxd	2026-06-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt6a002ribns0z97c3wg	2026-06-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt6j002sibnsa5stjt6x	2026-06-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt6t002tibnstzud9gsl	2026-06-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt72002uibnsh7cufuhx	2026-06-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt7c002vibnsuj21sn14	2026-06-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt7k002wibnsxi6oby1m	2026-06-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt7v002xibnsuok8kvst	2026-06-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt83002yibnsx0gwtvg8	2026-06-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt8a002zibnsji7803hm	2026-06-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt8h0030ibns385qphct	2026-06-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt8o0031ibnsftm1galz	2026-06-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt8w0032ibnszbak03vg	2026-06-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt930033ibnsia4c8u5s	2026-06-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt9d0034ibns8mg7hdn0	2026-06-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt9n0035ibnsbidrnool	2026-06-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawt9w0036ibnspr8v3l1h	2026-06-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawta50037ibnswznqsgo4	2026-06-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawta80038ibnsx758rgzx	2026-06-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtae0039ibnsladblal6	2026-07-01 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtai003aibnsg1jok6ra	2026-07-02 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtan003bibnsqhs5xvyr	2026-07-03 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtas003cibnsxe9mhmkt	2026-07-04 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtaw003dibnsenbawwpr	2026-07-05 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtb2003eibns6uu8r52k	2026-07-06 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtb8003fibns4riresut	2026-07-07 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtbc003gibns7raiy08r	2026-07-08 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtbi003hibnsn4r3hm01	2026-07-09 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtbm003iibnsjnxhdjow	2026-07-10 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtbr003jibnsm314c2u1	2026-07-11 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtbv003kibnsvoqn88jr	2026-07-12 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtbz003libns7wof6h8e	2026-07-13 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtc3003mibnsj6p71tuq	2026-07-14 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtca003nibnscyx8hwp3	2026-07-15 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtch003oibns8749jgbk	2026-07-16 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtcm003pibnswexswrey	2026-07-17 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtct003qibnsziw4zp1s	2026-07-18 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtcz003ribnsekkv1p6f	2026-07-19 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtd4003sibnsgku2n0xn	2026-07-20 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtd9003tibnsqozyk3v9	2026-07-21 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtde003uibns8eh8qwqs	2026-07-22 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtdi003vibnsjqo8s7tz	2026-07-23 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtdm003wibnsuur0gmzj	2026-07-24 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtdq003xibnswezayrdk	2026-07-25 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtdv003yibnsd77hgtbn	2026-07-26 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtdz003zibnsv22tv797	2026-07-27 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawte50040ibnsl3r3v4hi	2026-07-28 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawte90041ibns9chm8pmv	2026-07-29 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawted0042ibnsx8h6wfj6	2026-07-30 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawteh0043ibnsa1tj5ds1	2026-07-31 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtf70048ibnsixgb702x	2026-08-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtfg0049ibnsbhgg09e4	2026-08-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtft004aibnsxbpy1kqv	2026-08-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtg4004bibnsrr083zw7	2026-08-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtgf004cibnspltu63wv	2026-08-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtgr004dibns5wzskfre	2026-08-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawth3004eibns79e6yzax	2026-08-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawthd004fibns8vbxjt7b	2026-08-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawthm004gibnsgdvixjvc	2026-08-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawthp004hibnsnodvpr7m	2026-08-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtht004iibnsrsf0p7ko	2026-08-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawthz004jibnsqgk8ly5a	2026-08-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawti3004kibnsd2lko6df	2026-08-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawti7004libnspnnzbw76	2026-08-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtib004mibnssujumjlv	2026-08-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtif004nibns8bhyrywv	2026-08-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtij004oibns5cewh8ao	2026-08-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtim004pibnsaw9v1v9z	2026-08-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtip004qibnsh2k861kp	2026-08-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtit004ribnskp3jzw8r	2026-08-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtiy004sibnssua6r0f6	2026-08-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtj2004tibns0oivzogn	2026-08-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtj6004uibnspgkmvmk8	2026-08-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtjb004vibnss5ndbr80	2026-08-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtjh004wibns9tic5n3a	2026-08-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtjm004xibns8uq3ejvj	2026-08-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtjs004yibnsa0847oxs	2026-08-31 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtkk0053ibnsdlc3yu4a	2026-09-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtkp0054ibnshieyjekp	2026-09-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtku0055ibnscmg35rxs	2026-09-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtky0056ibnsh64673v3	2026-09-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtl30057ibnsh4day1c8	2026-09-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtl80058ibnss74izlmx	2026-09-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtlc0059ibnsgd5gjau2	2026-09-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtlh005aibnsgsaaf6ou	2026-09-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtln005bibnsyhosei4q	2026-09-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtls005cibns2ygt6ob6	2026-09-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtlw005dibns293yr87h	2026-09-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtm0005eibns94qe6a53	2026-09-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtm4005fibns5anjwsvu	2026-09-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtm8005gibnsf3g5wraw	2026-09-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtme005hibnsi237bcec	2026-09-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtmm005iibnswld8v6ph	2026-09-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtmp005jibns70j08x5d	2026-09-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtmv005kibnsf9gpye2w	2026-09-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtn3005libnsollhuo3h	2026-09-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtnb005mibnsa6a85v9b	2026-09-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtnj005nibnsop2ajymu	2026-09-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtnu005oibnsq0o225np	2026-09-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawto4005pibns563y7a3y	2026-09-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtod005qibnswcb0ibtk	2026-09-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawton005ribnss0mseddr	2026-09-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtpo005xibnsfcxqode9	2026-10-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtjz004zibns53eqlly0	2026-09-01 03:00:00	Pewmafe	f	70000.000000000000000000000000000000	\N
cmmfawtpl005wibnstlr09u0w	2026-10-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtk50050ibns3srzpb2i	2026-09-02 03:00:00	Pewmafe	f	70000.000000000000000000000000000000	\N
cmmfawtkc0051ibns76g1z0xl	2026-09-03 03:00:00	Pewmafe	f	70000.000000000000000000000000000000	\N
cmmfawtkg0052ibns55lei0g0	2026-09-04 03:00:00	Pewmafe	f	70000.000000000000000000000000000000	\N
cmmfawtel0044ibnstqel29bt	2026-08-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtep0045ibns9mw5b3v5	2026-08-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtet0046ibnshbdypnoh	2026-08-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtpt005yibnsjb8e23fm	2026-10-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtpy005zibnszcaps6i4	2026-10-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtq20060ibnsj389agwy	2026-10-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtq50061ibns3127uk3v	2026-10-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtq90062ibnshi77duny	2026-10-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqc0063ibns047ry651	2026-10-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqe0064ibnscif0z38k	2026-10-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqh0065ibnsmkj8b440	2026-10-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqj0066ibnsbqwhrbts	2026-10-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqm0067ibnss27af4us	2026-10-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqo0068ibnspc8pd7xs	2026-10-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqs0069ibnsy228lslf	2026-10-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqv006aibns21y0skva	2026-10-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtqx006bibns1saej58b	2026-10-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtr0006cibnsnbaziovp	2026-10-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtr2006dibnsu9wgc1qa	2026-10-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtr5006eibns6mzm8pbx	2026-10-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtr9006fibnsyrs38vb0	2026-10-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtrc006gibns6nj9wieg	2026-10-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtrf006hibns838nfnv2	2026-10-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtri006iibnsdin7rddz	2026-10-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtrn006jibnsa0oz3pmj	2026-10-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtrr006kibns9krlb2ke	2026-10-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtrw006libnse6g7x6h2	2026-10-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawts0006mibns3f54e6ye	2026-10-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtsl006sibnsqijsvlhx	2026-11-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtsp006tibnsem3ae7f4	2026-11-06 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtsu006uibnssiw2vjwb	2026-11-07 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtsx006vibnsivq3cvqu	2026-11-08 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtt1006wibnsqjcsxdlc	2026-11-09 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtt6006xibnshkcjkyvn	2026-11-10 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtta006yibnsj6kwwfqf	2026-11-11 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawttf006zibns2q4xub4c	2026-11-12 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtti0070ibnse3hn2pyg	2026-11-13 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawttl0071ibns1d2g4sxd	2026-11-14 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtto0072ibns0xd9xhwg	2026-11-15 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawttr0073ibns76jhqe6w	2026-11-16 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawttv0074ibnsjxpkpzl7	2026-11-17 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawttz0075ibnsduygxty1	2026-11-18 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtu20076ibns1hyt3tvi	2026-11-19 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtu40077ibnset10mjfq	2026-11-20 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtu80078ibns70j0ajeg	2026-11-21 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtub0079ibnsma0z88ia	2026-11-22 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtue007aibnssxliky77	2026-11-23 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtui007bibnsy9rg2olc	2026-11-24 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtul007cibnsh2lviqnp	2026-11-25 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtuo007dibnsfszn6b02	2026-11-26 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtur007eibns77la7jtl	2026-11-27 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtuu007fibnscu7qd1re	2026-11-28 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtux007gibnsml152dxa	2026-11-29 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtv0007hibnsxvt1s3yq	2026-11-30 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtv2007iibnst1w3dpp9	2026-12-01 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtv4007jibnsw50kdpy3	2026-12-02 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtv6007kibns4vwfqg7m	2026-12-03 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtv8007libnsbrdfd4of	2026-12-04 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtva007mibnsshs28qli	2026-12-05 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtve007nibnstpmtua2m	2026-12-06 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvh007oibnssgo9nacr	2026-12-07 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvk007pibnspbkmz33d	2026-12-08 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvm007qibns7bw1hysn	2026-12-09 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvo007ribnszy1bbzbi	2026-12-10 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvq007sibnszbawqqop	2026-12-11 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvs007tibnso2qnf84t	2026-12-12 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvu007uibns9u3gvns6	2026-12-13 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvw007vibnsm8cshimw	2026-12-14 03:00:00	Pewmafe	t	90000.000000000000000000000000000000	\N
cmmfawtvy007wibns2l2zbdj9	2026-12-15 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtw1007xibnszw730agv	2026-12-16 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtw3007yibnse4ffk5db	2026-12-17 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtw4007zibnsypjt9afx	2026-12-18 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtw60080ibnsif3csari	2026-12-19 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtw80081ibnsigmwpzqy	2026-12-20 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtwc0082ibnsvc6en1wy	2026-12-21 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtwe0083ibnseig27rtj	2026-12-22 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtwg0084ibns6w5y9r6w	2026-12-23 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtwi0085ibnsakq7zyyh	2026-12-24 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtwl0086ibnserqb8hrf	2026-12-25 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtwo0087ibnsajq2o3t2	2026-12-26 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtwq0088ibns4pdx5qhp	2026-12-27 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtwt0089ibnsdo9ppmoj	2026-12-28 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtwx008aibns9cwx7hxg	2026-12-29 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtx0008bibnsf9rjace2	2026-12-30 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtx4008cibnsl5ygij84	2026-12-31 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtx6008dibnskiseft25	2027-01-01 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtx9008eibnsfvs87033	2027-01-02 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxb008fibnstkj5fnd9	2027-01-03 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxd008gibns1j6iqq5k	2027-01-04 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxf008hibns7mrunzu0	2027-01-05 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxh008iibns2vkg3w4c	2027-01-06 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtxj008jibns1v5uelan	2027-01-07 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtxl008kibns4n9nssj1	2027-01-08 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxp008libnsd657zwmh	2027-01-09 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtxr008mibnshdhtj440	2027-01-10 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtsg006ribns73k5js77	2026-11-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawtxu008nibnscbyy3mmc	2027-01-11 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxw008oibnstp6v54ff	2027-01-12 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtxz008pibnsezt3uhoh	2027-01-13 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawty2008qibns6h5o4aq7	2027-01-14 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawty6008ribns9lz0nah4	2027-01-15 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawty9008sibnst248egqq	2027-01-16 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtyc008tibnshu2kjovy	2027-01-17 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtyf008uibnsi88sr2uy	2027-01-18 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtyj008vibnsykn00jy2	2027-01-19 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtyp008wibns2668qjxd	2027-01-20 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtyv008xibnseo05rxd9	2027-01-21 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtz0008yibnsv5woznu1	2027-01-22 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawtz6008zibnsiynadhc6	2027-01-23 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtzb0090ibns2xe1pj7d	2027-01-24 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtzf0091ibns0xaz8tfq	2027-01-25 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtzk0092ibns1gfqx4vp	2027-01-26 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtzo0093ibnsmwurr0js	2027-01-27 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtzs0094ibnszvek1ffw	2027-01-28 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawtzy0095ibns328fxk87	2027-01-29 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu030096ibns8pv4ukja	2027-01-30 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu060097ibnsgk7m094t	2027-01-31 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu090098ibns9hfvzr96	2027-02-01 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu0c0099ibns9br686t0	2027-02-02 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu0h009aibnsm27rm2h4	2027-02-03 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu0l009bibnsiaf7fw83	2027-02-04 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawu0p009cibnsn57l0t5g	2027-02-05 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu0v009dibnsapqmv48d	2027-02-06 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu11009eibnsb1a4vye8	2027-02-07 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu16009fibnseo54rsyh	2027-02-08 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu1c009gibnsi84qk1na	2027-02-09 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu1h009hibns8ydl2vsc	2027-02-10 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu1l009iibnskqyw6ol7	2027-02-11 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu1r009jibnsfytxuu62	2027-02-12 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu1w009kibnsw7qvamoi	2027-02-13 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu21009libnsoe1h9suh	2027-02-14 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu26009mibns8e7azf6b	2027-02-15 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu2c009nibnsfvkmyhzg	2027-02-16 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu2h009oibnsgem3sbxc	2027-02-17 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu2m009pibnse40b3mk2	2027-02-18 03:00:00	Pewmafe	f	120000.000000000000000000000000000000	\N
cmmfawu2r009qibns1zw8nn61	2027-02-19 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu2v009ribns4rzavmdu	2027-02-20 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu30009sibnsp9o2c6gk	2027-02-21 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu33009tibnsobv5e5kv	2027-02-22 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu38009uibnsaqmnu11d	2027-02-23 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu3c009vibnsgv5ka4hn	2027-02-24 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu3h009wibnse66dook5	2027-02-25 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu3l009xibns87nwtaaf	2027-02-26 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu3q009yibnsr2wqbxan	2027-02-27 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu3w009zibns2csw7huw	2027-02-28 03:00:00	Pewmafe	t	120000.000000000000000000000000000000	\N
cmmfawu4100a0ibns7z8nl3qy	2027-03-01 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawu4500a1ibns9de4kzm1	2027-03-02 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawu4900a2ibnst76z2ax6	2027-03-03 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawu4d00a3ibnsdpgg5xa3	2027-03-04 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawu4h00a4ibnsin7f5zeo	2027-03-05 03:00:00	Pewmafe	t	70000.000000000000000000000000000000	\N
cmmfawu4l00a5ibns7d29yt5p	2026-03-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu4p00a6ibns16eh5enj	2026-03-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu4t00a7ibnsh5wc5p9z	2026-03-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu4x00a8ibnsa2hml6xj	2026-03-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5100a9ibns1rs87ypt	2026-03-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5600aaibnsqtcfa1ec	2026-03-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5a00abibnssjoa3yg8	2026-03-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5f00acibns1rbrmx78	2026-03-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5m00adibns6icztpqi	2026-03-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5s00aeibnsf272uchg	2026-03-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu5y00afibnseu4uzboe	2026-03-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6300agibnskx12h31i	2026-03-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6700ahibnsx5lqkc35	2026-03-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6b00aiibnsg84isla4	2026-03-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6f00ajibns352ymnyg	2026-03-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6k00akibns5geefxg1	2026-03-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6o00alibnsyi58vx4u	2026-03-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6s00amibnsov4j0nay	2026-03-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu6w00anibns3gkhthk0	2026-03-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7100aoibnsh29adtl2	2026-03-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7500apibnswbhast1o	2026-03-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7900aqibnsilxviaos	2026-03-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7d00aribns0p1pv42s	2026-03-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7i00asibnsqr3a8g5r	2026-03-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7m00atibnspdtl408e	2026-03-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7q00auibnslgy0xida	2026-03-31 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu7v00avibnslk78a7sq	2026-04-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8100awibnszshdvfyl	2026-04-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8600axibns8f6m47wt	2026-04-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8c00ayibnstx88n4lx	2026-04-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8f00azibns2e1rz8dm	2026-04-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8j00b0ibnst1palher	2026-04-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8o00b1ibnsux8ya0y6	2026-04-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8v00b2ibnsveid3d5f	2026-04-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu8z00b3ibnsngpkafgz	2026-04-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9300b4ibnstsvq3c9i	2026-04-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9700b5ibns8xkevoy3	2026-04-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9b00b6ibnswwapuoq4	2026-04-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9f00b7ibnsrswnh9gm	2026-04-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9l00b8ibnshn9n2smh	2026-04-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9q00b9ibnsxrfnoimc	2026-04-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9u00baibnsigvw7neg	2026-04-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawu9y00bbibnsgy8cqykj	2026-04-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawua200bcibns3axqpjhn	2026-04-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawua600bdibnsw17p3fn8	2026-04-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawua900beibnskbuhf9sq	2026-04-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuad00bfibnsik0sf3pw	2026-04-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuah00bgibns0akjbh63	2026-04-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuan00bhibns0dw3n4mz	2026-04-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuaw00biibnshk5i1874	2026-04-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawub200bjibnsccde32q9	2026-04-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawub900bkibnssxrzaqbq	2026-04-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawubn00blibnszjfckyfp	2026-04-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawubr00bmibns2wlx8x34	2026-04-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawubu00bnibnssioz6xsg	2026-04-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawubw00boibnsti1cuqfe	2026-04-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuby00bpibns5jf6zqpl	2026-05-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuc100bqibnsklkv3q5v	2026-05-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuc300bribnsrfyfnhxx	2026-05-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuc600bsibnsiysh9hlh	2026-05-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuc800btibnsd9nnutst	2026-05-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuca00buibnsb5ahorb1	2026-05-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawucc00bvibnsrzjfxlv0	2026-05-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawucg00bwibnsa7se5ua0	2026-05-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawucj00bxibnsrba0h1lw	2026-05-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawucm00byibnsvf40dfh4	2026-05-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawucq00bzibnsyzwslvrg	2026-05-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuct00c0ibnsr0xj69ly	2026-05-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawucw00c1ibnsz30oybn3	2026-05-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawud000c2ibns306ehg0d	2026-05-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawud300c3ibns46for729	2026-05-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawud700c4ibnsztc4smo8	2026-05-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuda00c5ibnsntu6y2hp	2026-05-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawude00c6ibnsrk7fnpmo	2026-05-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawudj00c7ibnscy7o0386	2026-05-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawudo00c8ibns59dneb51	2026-05-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawudt00c9ibnsewjeiukf	2026-05-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawudz00caibnsw4ecdz8w	2026-05-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawue500cbibns6j0mpg81	2026-05-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuea00ccibns9ovvezro	2026-05-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawueg00cdibns537qdpth	2026-05-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuem00ceibns8g1xzmsi	2026-05-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawues00cfibnsbagstrl8	2026-05-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuf000cgibnsghqr2vp1	2026-05-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuf600chibnsubitzpar	2026-05-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawufe00ciibnsx612h1nc	2026-05-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawufn00cjibnsmywt00nh	2026-05-31 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawufx00ckibns2dt5cacv	2026-06-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawug700clibnsp1y6jm15	2026-06-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawugf00cmibnsyejlqb6b	2026-06-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawugn00cnibnsrtokuy61	2026-06-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawugu00coibns25oz6pjj	2026-06-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuh000cpibns2o5q7d0v	2026-06-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuh600cqibns1u1y9vwy	2026-06-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuhf00cribnso4lzjp6g	2026-06-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuho00csibnseq7s82o7	2026-06-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuhw00ctibnsm6vl7u8t	2026-06-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawui300cuibnsoi66v7mv	2026-06-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuib00cvibnsom4c1tgc	2026-06-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuij00cwibns0rkpm9sa	2026-06-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuir00cxibns7hv4lw14	2026-06-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuiz00cyibns6q41qqt0	2026-06-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuj800czibnsgewqrlcz	2026-06-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawujh00d0ibnsdwfztav6	2026-06-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawujn00d1ibnsuanqg0kj	2026-06-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawujr00d2ibnsyc3u5gef	2026-06-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuju00d3ibnszx2w8047	2026-06-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawujx00d4ibnsg14ds3ti	2026-06-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuk100d5ibnsfvkktmf2	2026-06-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuk600d6ibns3y6p7b02	2026-06-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuk900d7ibnsdiqq3mro	2026-06-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawukb00d8ibnsk4dxfpc1	2026-06-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuke00d9ibnsetjcf0fi	2026-06-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuki00daibnskykyvyas	2026-06-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawukl00dbibnsop9v4sxz	2026-06-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuko00dcibns2osohpri	2026-06-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawukq00ddibns7h4qa02u	2026-06-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawukt00deibns67o0ehj0	2026-07-01 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawukw00dfibnsefjzmfv5	2026-07-02 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawuky00dgibnsh7x9vajp	2026-07-03 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawul100dhibnse3z6w18o	2026-07-04 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawul400diibnsbo17gew6	2026-07-05 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawul700djibnsmzgp77qr	2026-07-06 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulb00dkibnsetjmitpc	2026-07-07 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawule00dlibnsye5t69on	2026-07-08 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulg00dmibnsjq2u72az	2026-07-09 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulj00dnibns6y7wi7pn	2026-07-10 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawull00doibns1799c00e	2026-07-11 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulo00dpibns5jctwame	2026-07-12 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulr00dqibnsnem4jctq	2026-07-13 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawult00dribnsr1fvxmio	2026-07-14 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulw00dsibnsnhl358l8	2026-07-15 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawulz00dtibnsdj90ef1t	2026-07-16 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawum300duibnseo2pf2dv	2026-07-17 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawum700dvibnsnognrim6	2026-07-18 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumd00dwibnsojzkz4zj	2026-07-19 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumi00dxibnsc09qq1bm	2026-07-20 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumm00dyibnskv1ejhbq	2026-07-21 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumr00dzibnskzbbe8gb	2026-07-22 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumt00e0ibns9cu7k3q7	2026-07-23 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumv00e1ibnskwwqbg3k	2026-07-24 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawumy00e2ibnsoisf3npy	2026-07-25 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawun000e3ibnsp9d3fxei	2026-07-26 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawun600e4ibnsom6brhlt	2026-07-27 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawun900e5ibnsx8kin3ae	2026-07-28 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawunc00e6ibnsl5ajksbw	2026-07-29 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawunf00e7ibns8bxhwjda	2026-07-30 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawunj00e8ibnss9v8mpq6	2026-07-31 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawunm00e9ibnsral9ww7o	2026-08-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawunp00eaibnskbxb2agv	2026-08-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawunt00ebibnsxydv5grj	2026-08-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawunw00ecibnsz4pgk1x8	2026-08-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawunz00edibnsktah84la	2026-08-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuo300eeibnsg2op3kzf	2026-08-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuo600efibns8lgfg4ba	2026-08-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuo800egibnsiu4eqvgg	2026-08-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuob00ehibnscm32kvur	2026-08-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuoe00eiibnsdgnj1qx7	2026-08-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuog00ejibnswhzry8wq	2026-08-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuoj00ekibnszy385pwr	2026-08-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuol00elibnswpyrrhor	2026-08-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuon00emibnsj2dnu6xm	2026-08-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuoq00enibns4854w73a	2026-08-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuos00eoibnsaaebb1ic	2026-08-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuov00epibnspgj234g0	2026-08-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuox00eqibnsadgp0lo6	2026-08-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawup000eribnsl4bu963e	2026-08-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawup300esibnsb61uf79e	2026-08-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawup700etibns284yepjj	2026-08-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupa00euibnspbkmy0id	2026-08-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupd00evibnsp48npwey	2026-08-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupg00ewibnsgby3zk95	2026-08-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupj00exibns5ybxyae3	2026-08-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupm00eyibnsl0og2en5	2026-08-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupo00ezibnsb2qn4xw8	2026-08-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupr00f0ibns02dvsm2x	2026-08-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupu00f1ibnscefwddpz	2026-08-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupw00f2ibnscjuapup2	2026-08-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawupy00f3ibnsxei1l4az	2026-08-31 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuq000f4ibnslo5e8isi	2026-09-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuq200f5ibnsh3ozc1wd	2026-09-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuq500f6ibnsvg29vtf2	2026-09-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuq800f7ibnsajtsrysf	2026-09-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqa00f8ibns93m2s5di	2026-09-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqd00f9ibnsjwddcv75	2026-09-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqh00faibns976wljqh	2026-09-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqk00fbibnsjl9j63a1	2026-09-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqo00fcibnse0dbq8po	2026-09-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqr00fdibnskv465hyn	2026-09-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqu00feibnsd9zaon3p	2026-09-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqw00ffibnsfdz2fn2k	2026-09-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuqy00fgibnsdwer3d2w	2026-09-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawur000fhibnsk4od27mp	2026-09-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawur200fiibnsr7a4duj9	2026-09-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawur400fjibns7l9q114t	2026-09-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawur600fkibnsm6u8cls7	2026-09-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawur800flibnsmvt7ld6v	2026-09-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawurc00fmibns653utv8w	2026-09-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawurg00fnibnssjh3eesd	2026-09-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawurk00foibnsd6ayok26	2026-09-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawurp00fpibnsev82c26v	2026-09-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawurt00fqibnsqje2vka4	2026-09-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawurx00fribnsjxhlonb3	2026-09-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawus300fsibnskjlw1xly	2026-09-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawus800ftibnsztr7vf1e	2026-09-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawusb00fuibnss7dgb154	2026-09-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuse00fvibnsmfptssqw	2026-09-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawusi00fwibnspx44me8y	2026-09-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawusm00fxibns5i08eatj	2026-09-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawusq00fyibnsmlqi7al6	2026-10-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawusu00fzibnsoxh5abym	2026-10-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawusy00g0ibnsinogwyw8	2026-10-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawut200g1ibnsk86dyiuv	2026-10-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawut800g2ibnsbezv5e5u	2026-10-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawutd00g3ibns37zjkl0c	2026-10-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuth00g4ibns8r6qg8cl	2026-10-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawutl00g5ibnslnwg744e	2026-10-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuts00g6ibnsmfn9nwqd	2026-10-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawutx00g7ibns2znyel5p	2026-10-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuu200g8ibnsbh7zf7uz	2026-10-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuu700g9ibns33pf8009	2026-10-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuud00gaibnscihlz6i6	2026-10-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuuk00gbibnsb11ypcgf	2026-10-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuuo00gcibns6lehtda4	2026-10-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuus00gdibns06hguqsa	2026-10-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuuv00geibnsoorbhofw	2026-10-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuv000gfibnsqpy4ks0h	2026-10-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuv500ggibns8i9kietl	2026-10-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuv900ghibnsx81slc57	2026-10-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuvd00giibnsrtyqmp3w	2026-10-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuvi00gjibnsqjqtqovy	2026-10-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuvn00gkibnsgufolzhr	2026-10-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuvt00glibnsclszlj69	2026-10-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuvy00gmibnsl76715ih	2026-10-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuw200gnibnslvxo8zbw	2026-10-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuw700goibnsj7a69ars	2026-10-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuwb00gpibnsghvfhrh1	2026-10-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuwi00gqibns48h5psg1	2026-10-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuwo00gribns0absvj0r	2026-10-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuwt00gsibnsxhzbe77n	2026-10-31 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuwy00gtibnsnytax5l8	2026-11-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawux200guibnsya4wia56	2026-11-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawux700gvibns2p24xpyt	2026-11-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuxe00gwibns77zhb5dj	2026-11-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuxj00gxibns1rtum73p	2026-11-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuxq00gyibnsatdgq9n6	2026-11-06 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuxv00gzibnsewiw4r0t	2026-11-07 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuxz00h0ibnsdc3yut5m	2026-11-08 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuy400h1ibnswgvmm0q8	2026-11-09 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuyd00h2ibnsre72kwtv	2026-11-10 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuyj00h3ibnsrd3q0qmy	2026-11-11 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuyo00h4ibnsmw2ov3ai	2026-11-12 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuyt00h5ibns9pt8m8e2	2026-11-13 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuyy00h6ibns7ng9t85m	2026-11-14 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuz300h7ibnsa45ptabx	2026-11-15 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuz700h8ibnsafnzde70	2026-11-16 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuzb00h9ibnsbrv4bljx	2026-11-17 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuzf00haibns8lzc7os3	2026-11-18 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuzj00hbibns6wp6qfwc	2026-11-19 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuzo00hcibns6785tfi8	2026-11-20 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuzs00hdibnsz5vlh1di	2026-11-21 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawuzw00heibns3w1shalq	2026-11-22 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0200hfibnsvylw60ly	2026-11-23 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0700hgibnsjlwb05c3	2026-11-24 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0c00hhibnsq5trdhna	2026-11-25 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0i00hiibns3hae6omp	2026-11-26 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0n00hjibnsxvokkrg4	2026-11-27 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0r00hkibnsc4ugncgo	2026-11-28 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv0v00hlibnsg21gxzi5	2026-11-29 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv1000hmibnsmwuwun07	2026-11-30 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawv1500hnibnswgisnler	2026-12-01 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv1900hoibnscvrw24z5	2026-12-02 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv1d00hpibnsdw70pz4r	2026-12-03 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv1h00hqibnsfej0m20w	2026-12-04 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv1l00hribnsby1j3ehw	2026-12-05 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv1q00hsibnsplfmw7ui	2026-12-06 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv1w00htibnse3c62e94	2026-12-07 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2100huibnsognf8t5k	2026-12-08 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2500hvibns949uy3ld	2026-12-09 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2b00hwibnseag2rf6p	2026-12-10 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2f00hxibns4mgfevcm	2026-12-11 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2k00hyibnssdwu37up	2026-12-12 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2o00hzibnslepe26if	2026-12-13 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2s00i0ibns99t5v44n	2026-12-14 03:00:00	Luminar Mono	t	85000.000000000000000000000000000000	\N
cmmfawv2w00i1ibnsl37kzw1z	2026-12-15 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv3100i2ibns99juvku2	2026-12-16 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv3500i3ibnsgsylh8dn	2026-12-17 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv3900i4ibns143qf25x	2026-12-18 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv3e00i5ibns3hc29c5u	2026-12-19 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv3k00i6ibnssktej78y	2026-12-20 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv3r00i7ibnsqmjijvuv	2026-12-21 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv3w00i8ibnssls9evm8	2026-12-22 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv4100i9ibnsaa7ymgge	2026-12-23 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv4600iaibnsopjs8exc	2026-12-24 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv4c00ibibnsutqnmbbl	2026-12-25 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv4g00icibnse6ma90do	2026-12-26 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv4k00idibnsx5p4pz4d	2026-12-27 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv4o00ieibnsey7tmgjt	2026-12-28 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv4t00ifibnsiczkeld9	2026-12-29 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv4x00igibnsmoiqqeva	2026-12-30 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5100ihibns844z62gw	2026-12-31 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5500iiibns2f1i78tj	2027-01-01 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5800ijibnskq5uywf6	2027-01-02 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv5c00ikibns9mypxz7m	2027-01-03 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5h00ilibnsk97i2vv4	2027-01-04 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5m00imibnsgbx0p82h	2027-01-05 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5r00inibnspcqrvyg5	2027-01-06 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv5x00ioibnst6fp6wkj	2027-01-07 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv6200ipibns3rbik9ls	2027-01-08 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv6700iqibnscqlint0d	2027-01-09 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv6c00iribnsqeuiap9x	2027-01-10 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv6g00isibns8tminu1w	2027-01-11 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv6l00itibns5khad34e	2027-01-12 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv6p00iuibns63kv7wpq	2027-01-13 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv6s00ivibnsy6h6op60	2027-01-14 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv6y00iwibnsio011dp2	2027-01-15 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv7400ixibnst4h2aat3	2027-01-16 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv7b00iyibnshy7anhtp	2027-01-17 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv7m00izibnsh9t51ufq	2027-01-18 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv7u00j0ibns65ivjxwl	2027-01-19 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv7y00j1ibnsjyotb3wg	2027-01-20 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8200j2ibns7oie7iqq	2027-01-21 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8600j3ibns3p0uzxte	2027-01-22 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8a00j4ibnsrdosucac	2027-01-23 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8d00j5ibns1nh5noau	2027-01-24 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8g00j6ibns4m6yoxaz	2027-01-25 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8j00j7ibnszualc2xa	2027-01-26 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8l00j8ibnswxf12c8n	2027-01-27 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8o00j9ibnstzeadd39	2027-01-28 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8r00jaibnsnaigypo9	2027-01-29 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8u00jbibnsxybu656w	2027-01-30 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv8x00jcibns83lpb1ur	2027-01-31 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9000jdibnsauw3kcdo	2027-02-01 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9400jeibnsv7tb55fu	2027-02-02 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9700jfibnsu1je7xip	2027-02-03 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9900jgibns1l2x4624	2027-02-04 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9c00jhibnslj5wbk9d	2027-02-05 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9f00jiibnsc1t8j2oc	2027-02-06 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9h00jjibns1gui7ppn	2027-02-07 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawv9k00jkibnsfw98q5rz	2027-02-08 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9m00jlibnsjdz02cev	2027-02-09 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9o00jmibnslfvu6jld	2027-02-10 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9q00jnibnsouu6yjdc	2027-02-11 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9s00joibns9cc52861	2027-02-12 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9u00jpibns6zg0yld2	2027-02-13 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawv9x00jqibnscvn6s1if	2027-02-14 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawva000jribns0rezv4lw	2027-02-15 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawva200jsibnsdxb5dpa4	2027-02-16 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawva500jtibnsyqlhtoty	2027-02-17 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawva700juibns3ggdkrvs	2027-02-18 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvaa00jvibns0s4gw4u0	2027-02-19 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvac00jwibnsxztw5uet	2027-02-20 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvae00jxibnsn9ov5qed	2027-02-21 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvag00jyibnsxh89wtyw	2027-02-22 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvai00jzibnsqm2czacn	2027-02-23 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvak00k0ibns6hwdkmes	2027-02-24 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawvan00k1ibnsyiirq8nk	2027-02-25 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawvap00k2ibnsfeznj5ej	2027-02-26 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvas00k3ibns61zv67w2	2027-02-27 03:00:00	Luminar Mono	f	100000.000000000000000000000000000000	\N
cmmfawvau00k4ibnsxtjtmfr9	2027-02-28 03:00:00	Luminar Mono	t	100000.000000000000000000000000000000	\N
cmmfawvax00k5ibns0ytzib5d	2027-03-01 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawvaz00k6ibnsxzd42wh8	2027-03-02 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawvb300k7ibnstetcz3ta	2027-03-03 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawvb700k8ibnstq363wst	2027-03-04 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawvba00k9ibnsmcu9zr2i	2027-03-05 03:00:00	Luminar Mono	t	65000.000000000000000000000000000000	\N
cmmfawvbd00kaibns73xt4ac1	2026-03-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvbf00kbibns9g1jn1cu	2026-03-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvbh00kcibnsvrvs4v2l	2026-03-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvbk00kdibnsz76vp4ji	2026-03-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvbp00keibnsm1r4017x	2026-03-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvbs00kfibnshnd72c2q	2026-03-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvbv00kgibnszokc8ohl	2026-03-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvby00khibnsq4m5fx9k	2026-03-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvc000kiibnsicv1fp9k	2026-03-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvc300kjibnsb6n7uoip	2026-03-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvc700kkibns6xxyneb1	2026-03-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvca00klibnsuucd2htz	2026-03-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvcd00kmibnsy3l8pjg4	2026-03-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvch00knibnsjw5b6kcy	2026-03-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvcl00koibnspbgtx4p4	2026-03-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvco00kpibns3ldzfmlr	2026-03-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvcq00kqibnsqsg7e4fe	2026-03-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvcs00kribns1huefmj8	2026-03-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvcv00ksibnsmrbc9f3e	2026-03-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvd100ktibnsgg6cf1pz	2026-03-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvd400kuibnse7nbsa3l	2026-03-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvd600kvibnsp5i0yava	2026-03-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvda00kwibns0psia3zo	2026-03-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdd00kxibns40o5w2nk	2026-03-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdg00kyibns27j98ojc	2026-03-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdj00kzibnsvp71y1p3	2026-03-31 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdl00l0ibns9efoq8pq	2026-04-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdp00l1ibns3mpvp755	2026-04-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvds00l2ibns64zcdefh	2026-04-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdu00l3ibns948fagbd	2026-04-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvdx00l4ibns48jpcfmu	2026-04-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawve000l5ibnsnkp24sc3	2026-04-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawve200l6ibnsa7fvvk5e	2026-04-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawve500l7ibnsjx4dsww4	2026-04-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawve800l8ibns68r06l6v	2026-04-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvea00l9ibns8us2ysoo	2026-04-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawved00laibnslfo1cyzy	2026-04-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawveh00lbibnsw4b3h69b	2026-04-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvek00lcibnseqyyd8m2	2026-04-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvem00ldibnsi1bcouwa	2026-04-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawveo00leibnsslab9sp8	2026-04-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawves00lfibnsqgkfv0rt	2026-04-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawveu00lgibnsv4esjdq1	2026-04-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvew00lhibnshhv31tu3	2026-04-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvf000liibnsr2h2m63e	2026-04-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvf300ljibnshba22q8p	2026-04-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvf600lkibnsbnpugd8q	2026-04-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvf900llibnsqrsnr0eh	2026-04-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvfe00lmibns5kvshge3	2026-04-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvfj00lnibnsfzclzs93	2026-04-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvfm00loibnsm2hoqtg2	2026-04-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvfo00lpibnsjaqvk49u	2026-04-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvfq00lqibns3ax1wksp	2026-04-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvft00lribns0ac3x1c5	2026-04-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvfx00lsibnsnxoot7qd	2026-04-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvg000ltibnsy4axkc5q	2026-04-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvg300luibnsm7pc3tbh	2026-05-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvg600lvibns3qjp5fym	2026-05-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvg900lwibns3ah4fv2g	2026-05-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvgc00lxibns5zur99h0	2026-05-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvgf00lyibnsvy500wrx	2026-05-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvgk00lzibnsktzbrpwq	2026-05-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvgn00m0ibnsklbduqha	2026-05-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvgr00m1ibnsl5u3s4h5	2026-05-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvgx00m2ibnsa91tjp1r	2026-05-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvh300m3ibns0cflvm6h	2026-05-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvha00m4ibnsrspsh9dn	2026-05-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvhe00m5ibns7tn1saal	2026-05-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvhi00m6ibns31hf186w	2026-05-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvhl00m7ibnslk0ija8t	2026-05-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvhp00m8ibnsw5krdkm2	2026-05-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvht00m9ibns13q857d2	2026-05-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvhy00maibns39w49vas	2026-05-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvi200mbibnsc0bjfwx3	2026-05-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvi600mcibnsdigbmuur	2026-05-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvib00mdibnsfhd6lovw	2026-05-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvif00meibnsrtby1vll	2026-05-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvij00mfibnsaqd9ulu9	2026-05-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvin00mgibnsa0koa74r	2026-05-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawviv00mhibnshjpyznss	2026-05-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvj300miibns4q4ibvzd	2026-05-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvj900mjibns9x78u8z4	2026-05-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvjf00mkibnst1oe6cbg	2026-05-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvjj00mlibnsieskycgk	2026-05-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvjn00mmibnsrbd6sihf	2026-05-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvjr00mnibns2j3zn9sd	2026-05-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvjx00moibnshf08kdie	2026-05-31 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvku00mtibnswcpy332q	2026-06-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvkz00muibnsf6nes5yf	2026-06-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvl200mvibnskc9hp2go	2026-06-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvl600mwibnsr8gv431c	2026-06-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvl900mxibns4hajhdw7	2026-06-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvlf00myibns0m52cznk	2026-06-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvlj00mzibnsjlg0g3tl	2026-06-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvln00n0ibnsy3f8u544	2026-06-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvlr00n1ibnsbrema02y	2026-06-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvlv00n2ibns9jbrlfa5	2026-06-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvlz00n3ibnsjaewxp2y	2026-06-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvm300n4ibnsjckwr2tu	2026-06-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvm800n5ibnsrcpotvkr	2026-06-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvme00n6ibnscbpk2qz8	2026-06-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvmj00n7ibnsdt9yygh3	2026-06-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvmr00n8ibns49pl4anu	2026-06-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvmx00n9ibnsqd2w74km	2026-06-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvn100naibnsq158vlhy	2026-06-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvn500nbibnskq0k3vtf	2026-06-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvna00ncibns4ycy6sr2	2026-06-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvnd00ndibnsbr233o9u	2026-06-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvnj00neibnslgfzmzgl	2026-06-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvnn00nfibns3ok3xmff	2026-06-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvkn00mribnspn3ahixy	2026-06-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvkq00msibnsj84k7tzp	2026-06-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvkf00mqibnszagnql7a	2026-06-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvnr00ngibnsumuti23k	2026-06-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvny00nhibnscez13ek8	2026-06-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvo400niibnskcibsmrf	2026-06-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvoa00njibnsln62vwt3	2026-07-01 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvof00nkibnsvwurpden	2026-07-02 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvok00nlibnsmte0oioa	2026-07-03 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvop00nmibnsnnzpx40x	2026-07-04 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvou00nnibnsem84skbz	2026-07-05 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvoy00noibnsic4tf2ds	2026-07-06 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvp200npibnsk4b83cka	2026-07-07 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvp900nqibnspdb1gckd	2026-07-08 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvpi00nribnstfdg4se9	2026-07-09 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvpp00nsibns8o27spxc	2026-07-10 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvpv00ntibnste04qbpi	2026-07-11 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvq100nuibnsa7qwg2nn	2026-07-12 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvq800nvibnstsf8ywr3	2026-07-13 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvqe00nwibns2fhcaoza	2026-07-14 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvqj00nxibnsigrpoxjt	2026-07-15 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvqo00nyibnsbr4km0op	2026-07-16 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvqs00nzibnse0dgfmmp	2026-07-17 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvqw00o0ibnsps2hy86l	2026-07-18 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvqz00o1ibnsz57y1hjl	2026-07-19 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvr300o2ibns2s68gyoq	2026-07-20 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvr800o3ibnsueicotan	2026-07-21 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvrc00o4ibnskuhpdqy9	2026-07-22 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvrh00o5ibns4gsdniab	2026-07-23 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvrn00o6ibnsliiah5pa	2026-07-24 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvrr00o7ibnsimq7ndeq	2026-07-25 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvrv00o8ibnsmdfukxyi	2026-07-26 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvry00o9ibnsxm3jp6a0	2026-07-27 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvs200oaibnseze62bnc	2026-07-28 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvs500obibnswdyr2buo	2026-07-29 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvs700ocibns32aeryuo	2026-07-30 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvsb00odibnsisee05ug	2026-07-31 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfawvsf00oeibnsbt2hkwrk	2026-08-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvsk00ofibnsknskevpn	2026-08-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvsp00ogibnsr10dnh7m	2026-08-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvsu00ohibnsscisg547	2026-08-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvsx00oiibnsxsxyrgcu	2026-08-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvt200ojibnshb95fpfz	2026-08-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvt700okibnsl9c8cbxf	2026-08-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvtc00olibnsnfn37kph	2026-08-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvtg00omibnsdzcix1vg	2026-08-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvtk00onibnschlpezrn	2026-08-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvto00ooibns8c3yqqh5	2026-08-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvts00opibnsaxuoet50	2026-08-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvtv00oqibns4d467jog	2026-08-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvtz00oribnsmg73hkj8	2026-08-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvu300osibns0fiksj1w	2026-08-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvu700otibnsdzw4m9u7	2026-08-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvua00ouibnsukzuw4ra	2026-08-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvud00ovibns7xb714xe	2026-08-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvuh00owibnsrsi4zewp	2026-08-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvuj00oxibnsjx89pc4s	2026-08-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvum00oyibns3ordp6hs	2026-08-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvup00ozibns3tcoumlx	2026-08-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvut00p0ibns0iozblaf	2026-08-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvuy00p1ibnsltk1hsme	2026-08-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvv200p2ibnsaks4ipxy	2026-08-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvv700p3ibnss39uby6r	2026-08-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvva00p4ibnsa4tv0yi9	2026-08-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvve00p5ibnsh6ms2v2e	2026-08-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvvj00p6ibns77281fak	2026-08-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvvq00p7ibnspf9vzzwr	2026-08-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvvx00p8ibnsct95adf9	2026-08-31 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvw300p9ibns5kq48va1	2026-09-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvw800paibnsi4zq55bx	2026-09-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvwb00pbibns4yz32qai	2026-09-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvwf00pcibnsxfosmmgt	2026-09-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvwk00pdibns64iy8f7m	2026-09-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvwo00peibns8dji7dyu	2026-09-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvwv00pfibns6j43wzzz	2026-09-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvx400pgibnsd7q9wn5a	2026-09-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvxa00phibnsgo5imfu7	2026-09-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvxf00piibns9hl9c3e2	2026-09-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvxk00pjibns8lkwuz9s	2026-09-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvxp00pkibns7co6zbxn	2026-09-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvxu00plibnsj6ci1ldn	2026-09-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvxz00pmibnszrpuu9hx	2026-09-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvy400pnibnsc4b1z3ys	2026-09-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvy900poibns3znksuoh	2026-09-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvye00ppibnsx31ute8b	2026-09-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvyk00pqibns6yhj5v0i	2026-09-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvyq00pribns2mbe16k4	2026-09-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvyy00psibnsle4ij1rv	2026-09-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvz300ptibnsiwwmfzni	2026-09-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvz700puibns5hh8tuag	2026-09-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvzc00pvibnsr3tv1x3g	2026-09-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvzj00pwibnssgh0q6vh	2026-09-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvzq00pxibnsart0jm06	2026-09-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawvzz00pyibnsar7umsk6	2026-09-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww0800pzibns6ekbsdug	2026-09-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww0g00q0ibnsb5mtlw2y	2026-09-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww0m00q1ibnsum8cl2e3	2026-09-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww0r00q2ibnsihqkti8x	2026-09-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww0x00q3ibnsp8mi228i	2026-10-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1100q4ibns4yvk1ac6	2026-10-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1600q5ibnsxg32ycrw	2026-10-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1c00q6ibnsn05x8jqi	2026-10-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1g00q7ibns93fkdsr3	2026-10-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1j00q8ibnscza9l6dt	2026-10-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1n00q9ibnszuels22n	2026-10-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1q00qaibnsif31wy4u	2026-10-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1t00qbibns4hr0ob6z	2026-10-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1w00qcibnsfs2c207e	2026-10-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww1y00qdibns1wykrm9o	2026-10-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2300qeibns3pdwauna	2026-10-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2500qfibns5q3ffnrn	2026-10-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2800qgibnsyphvm8o4	2026-10-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2a00qhibns6crbstvj	2026-10-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2c00qiibnszdkpk8y1	2026-10-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2e00qjibns8bpg4t6t	2026-10-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2g00qkibnspdwg12db	2026-10-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2k00qlibnsy6xp0gbr	2026-10-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2m00qmibnsz325aayj	2026-10-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2o00qnibnsnx618fbv	2026-10-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2q00qoibnswoebs29b	2026-10-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2s00qpibnsb3de4wqo	2026-10-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2v00qqibns9htlqbmo	2026-10-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww2x00qribnselmplgdv	2026-10-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3000qsibnsljxjfoky	2026-10-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3300qtibnskgenosgh	2026-10-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3900quibns4170abfz	2026-10-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3d00qvibnsti14u7tc	2026-10-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3g00qwibns4mqbne0j	2026-10-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3j00qxibnsomuqyrhg	2026-10-31 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3l00qyibnsp9vzjyym	2026-11-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3o00qzibnsj4zc9kkb	2026-11-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3r00r0ibnsflyrtcxh	2026-11-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3t00r1ibnseifgyece	2026-11-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3v00r2ibnsj529s5wv	2026-11-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww3y00r3ibns4y1ovzxm	2026-11-06 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4100r4ibns7omv1kf4	2026-11-07 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4300r5ibnsaytzrghc	2026-11-08 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4600r6ibnsxrj0j8qk	2026-11-09 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4900r7ibnsrvjzkosm	2026-11-10 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4c00r8ibnsd8kqktgs	2026-11-11 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4e00r9ibnsako7igp3	2026-11-12 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4i00raibnsma91fz0z	2026-11-13 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4l00rbibns68v44yqb	2026-11-14 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4o00rcibnsy2248pvc	2026-11-15 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4s00rdibnsvni6jmrj	2026-11-16 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4w00reibnsnsnjdjgc	2026-11-17 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4y00rfibnsikklw4kh	2026-11-18 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww4z00rgibnsjezoqeoz	2026-11-19 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww5100rhibnskevtfrnb	2026-11-20 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww5700riibnsn4vnk3vu	2026-11-21 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww5c00rjibnsr4dh73en	2026-11-22 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww5i00rkibns7hkyintu	2026-11-23 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww5o00rlibnse15emgd9	2026-11-24 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww5v00rmibns8ybcfz86	2026-11-25 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww6400rnibnsvlqkzs1c	2026-11-26 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww6c00roibns9e9pm171	2026-11-27 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww6k00rpibns70u9bzm3	2026-11-28 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww6r00rqibnsp8ncdcyp	2026-11-29 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww6x00rribns643ncya5	2026-11-30 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfaww7200rsibnskm9gzgw7	2026-12-01 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7500rtibnsodn2xqhr	2026-12-02 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7900ruibnsnl3tjdr5	2026-12-03 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7c00rvibns7gn9mu3u	2026-12-04 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7g00rwibns2he8qrax	2026-12-05 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7i00rxibnse4v78fit	2026-12-06 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7l00ryibnslqfkq1fy	2026-12-07 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7p00rzibnswdelkrok	2026-12-08 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7s00s0ibnsfw6esns1	2026-12-09 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7v00s1ibnsts6y0qek	2026-12-10 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww7y00s2ibnsh77kaay3	2026-12-11 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww8000s3ibnsrtjteob2	2026-12-12 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww8300s4ibns2d8w0xrr	2026-12-13 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww8500s5ibnsz25sd5pk	2026-12-14 03:00:00	Luminar 2Amb	t	90000.000000000000000000000000000000	\N
cmmfaww8700s6ibns4nc8gy7l	2026-12-15 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8900s7ibnscnkzvxhu	2026-12-16 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8b00s8ibnskvxstd2x	2026-12-17 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8d00s9ibns4o7i7azj	2026-12-18 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8f00saibnsjx802meh	2026-12-19 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8h00sbibnsr1einbzg	2026-12-20 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8j00scibns68lhqjep	2026-12-21 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8n00sdibns2rnvns9w	2026-12-22 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8q00seibnsdiuehb1n	2026-12-23 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfaww8t00sfibnszodih41f	2026-12-24 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww8x00sgibnscz4x41rx	2026-12-25 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9000shibnsv48qh1zz	2026-12-26 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9300siibnsqs8tn8nf	2026-12-27 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9g00sjibnst3ockzip	2026-12-28 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9m00skibnscs6p9suq	2026-12-29 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9p00slibnsld4nfpun	2026-12-30 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9r00smibns0mcvr6jy	2026-12-31 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9t00snibnszkgu4roi	2027-01-01 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfaww9x00soibnsx3ssc01u	2027-01-02 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwa200spibns3f31pnt7	2027-01-03 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwa400sqibnsr1osdxi0	2027-01-04 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwa700sribnsltmri9vd	2027-01-05 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwa900ssibnszcde9kb4	2027-01-06 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwab00stibnskhkm4m3q	2027-01-07 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwad00suibnssotr3j4p	2027-01-08 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwag00svibnsrku1vwkp	2027-01-09 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwai00swibnsdyv8asm5	2027-01-10 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwal00sxibnseglcioih	2027-01-11 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwan00syibnscukg4q50	2027-01-12 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwar00szibnsctovu4ha	2027-01-13 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwav00t0ibnsa0y5cloz	2027-01-14 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawway00t1ibnsvumw6a14	2027-01-15 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwb100t2ibnsp3wwhbd2	2027-01-16 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwb400t3ibns8jawgxpa	2027-01-17 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwb800t4ibnsyzb35eqd	2027-01-18 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwbc00t5ibnsf6iv47l0	2027-01-19 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwbh00t6ibns7e21o5vq	2027-01-20 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwbk00t7ibns2bcixk43	2027-01-21 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwbr00t8ibnsaqmb3ms7	2027-01-22 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwbw00t9ibnswjrwmq2j	2027-01-23 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwc100taibnsoej8mzxk	2027-01-24 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwc600tbibnsqkr5k3ei	2027-01-25 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwcb00tcibnsptpdvrcf	2027-01-26 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwce00tdibns2x3ld2pr	2027-01-27 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwcj00teibnsyquasy3y	2027-01-28 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwcp00tfibnsowceapbe	2027-01-29 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwcs00tgibnskgrztpmr	2027-01-30 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwcv00thibns4dhgylkh	2027-01-31 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwd000tiibnswj35vjp6	2027-02-01 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwda00tjibns2om4n2bz	2027-02-02 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwdf00tkibnsv9qf8bg2	2027-02-03 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwdl00tlibnsbsf67e0d	2027-02-04 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwdq00tmibnszps1p511	2027-02-05 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwdv00tnibnsqnjscel8	2027-02-06 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwe000toibnshmnsvby9	2027-02-07 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwe400tpibns1opunubl	2027-02-08 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwe700tqibnsyuiuh649	2027-02-09 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwea00tribns8mtpnmdh	2027-02-10 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwed00tsibnsuelezek2	2027-02-11 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawweg00ttibns32e81pj8	2027-02-12 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwek00tuibnsrvfgdvaa	2027-02-13 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawweo00tvibnsu0fc2m08	2027-02-14 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwes00twibns4sx2glzx	2027-02-15 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwez00txibnsl123c45l	2027-02-16 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwf200tyibnsrx17ztsw	2027-02-17 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwf700tzibnskti5ao8l	2027-02-18 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwfb00u0ibnsn91bd1np	2027-02-19 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwff00u1ibns3i1svvio	2027-02-20 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwfi00u2ibnsemwmpc6m	2027-02-21 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwfn00u3ibns0ygdkxfy	2027-02-22 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwfr00u4ibnsxo4npnr6	2027-02-23 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwfv00u5ibnsxfvwawtt	2027-02-24 03:00:00	Luminar 2Amb	f	120000.000000000000000000000000000000	\N
cmmfawwfz00u6ibnsoz5568xs	2027-02-25 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwg300u7ibnsqiap1rh9	2027-02-26 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwg700u8ibnsstk14mdn	2027-02-27 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwga00u9ibnsclh5jgf4	2027-02-28 03:00:00	Luminar 2Amb	t	120000.000000000000000000000000000000	\N
cmmfawwge00uaibnsf51bg91x	2027-03-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawwgh00ubibns0bbejsyu	2027-03-02 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawwgl00ucibnslftme6ja	2027-03-03 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawwgp00udibns7529yzu9	2027-03-04 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawwgt00ueibnsgmu45ilr	2027-03-05 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
cmmfawwgy00ufibnskj8vyous	2026-03-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwh100ugibns7k9c2frb	2026-03-07 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwh500uhibnsjhmp7qrn	2026-03-08 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwh900uiibns6f1qx67y	2026-03-09 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwhe00ujibnsdci3qcj9	2026-03-10 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwhk00ukibnsns4tloi8	2026-03-11 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwhp00ulibnsxgel7oh2	2026-03-12 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwhs00umibnsah508lsd	2026-03-13 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwhv00unibns7wlr61rb	2026-03-14 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwhy00uoibnspch1gz6r	2026-03-15 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwi100upibnswg3n8z6f	2026-03-16 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwi400uqibnsz5a9xknr	2026-03-17 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwi800uribnsisvkzkre	2026-03-18 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwic00usibns5sbu89to	2026-03-19 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwig00utibnst3yzhumn	2026-03-20 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwik00uuibnsmi2bvvw1	2026-03-21 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwio00uvibnsq2nwxo8d	2026-03-22 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwir00uwibns3ch6rblq	2026-03-23 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwiv00uxibnsubg7oqfj	2026-03-24 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwiz00uyibns4kv7gpm9	2026-03-25 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwj500uzibnsbu6mc0ck	2026-03-26 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwjb00v0ibnsb6qx624n	2026-03-27 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwjg00v1ibns5ws3e9xp	2026-03-28 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwjk00v2ibnsq5amrubx	2026-03-29 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwjq00v3ibnsplrcwisd	2026-03-30 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwjv00v4ibnsajjvw3tb	2026-03-31 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwk000v5ibnskyzl2zsi	2026-04-01 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwk500v6ibnsc4mvj9xn	2026-04-02 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwk800v7ibns226hf8h3	2026-04-03 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwkc00v8ibns0t8mts09	2026-04-04 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwkh00v9ibnsf6t4xqr6	2026-04-05 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawwkn00vaibns0yitmepo	2026-04-06 03:00:00	LG	t	80000.000000000000000000000000000000	\N
cmmfawvk700mpibnsqvsz4tzd	2026-06-01 03:00:00	Luminar 2Amb	t	70000.000000000000000000000000000000	\N
\.


--
-- Data for Name: media_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media_files (id, complejo_id, tipo, url, caption, orden, creado_en) FROM stdin;
cmmfli0dg0004ibnwwmemhrpo	cmmfli0dg0000ibnwjrbo81yn	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg	Frente	0	2026-03-07 00:38:46.372
cmmfli0dg0005ibnwas22dgkq	cmmfli0dg0000ibnwjrbo81yn	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg	Living	1	2026-03-07 00:38:46.372
cmmfli0dg0006ibnwmvfxbmy1	cmmfli0dg0000ibnwjrbo81yn	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg	Cocina	2	2026-03-07 00:38:46.372
cmmfli0dg0007ibnw8t15ncw2	cmmfli0dg0000ibnwjrbo81yn	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/doritorio-805x453.jpg	Dormitorio	3	2026-03-07 00:38:46.372
cmmfli0dg0008ibnwzq8ysjng	cmmfli0dg0000ibnwjrbo81yn	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/patio-parri-805x453.jpg	Patio/Parrilla	4	2026-03-07 00:38:46.372
cmmfli0dg0009ibnwy7o2fmst	cmmfli0dg0000ibnwjrbo81yn	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/20221015_185828-805x453.jpg	Exterior	5	2026-03-07 00:38:46.372
cmmfli0dv000eibnwhjqnzlsw	cmmfli0du000aibnwm5xfvig5	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0011-805x453.jpg	Interior 1	0	2026-03-07 00:38:46.387
cmmfli0dv000fibnw06ke8bq5	cmmfli0du000aibnwm5xfvig5	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0010-805x453.jpg	Interior 2	1	2026-03-07 00:38:46.387
cmmfli0dv000gibnwifpt7pxj	cmmfli0du000aibnwm5xfvig5	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0012-805x453.jpg	Interior 3	2	2026-03-07 00:38:46.387
cmmfli0dv000hibnwlv7hyuhk	cmmfli0du000aibnwm5xfvig5	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0013-805x453.jpg	Interior 4	3	2026-03-07 00:38:46.387
cmmfli0ec000mibnwegliisvi	cmmfli0ec000iibnwg07zkpy8	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_LIVING2-725x453.jpg	Living	0	2026-03-07 00:38:46.404
cmmfli0ec000nibnwvf5ks4nl	cmmfli0ec000iibnwg07zkpy8	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/01a_frente_jpg-750x453.jpg	Frente	1	2026-03-07 00:38:46.404
cmmfli0ec000oibnw52jzcj0g	cmmfli0ec000iibnwg07zkpy8	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/cochera_complejo_luminar-725x453.jpg	Cochera	2	2026-03-07 00:38:46.404
cmmfli0ec000pibnwjmta00q6	cmmfli0ec000iibnwg07zkpy8	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_HABITACION2-725x453.jpg	Habitacion	3	2026-03-07 00:38:46.404
cmmfli0ec000qibnwqkj80vbv	cmmfli0ec000iibnwg07zkpy8	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_TOILET212-1-483x453.jpg	Bano	4	2026-03-07 00:38:46.404
cmmfli0ec000ribnwrzhc7ho8	cmmfli0ec000iibnwg07zkpy8	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/parrilla-2-amb-luminar-805x453.jpg	Parrilla	5	2026-03-07 00:38:46.404
cmmfli0ek000wibnw8v2pa171	cmmfli0ek000sibnw1y5xo5eq	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/frente-lg-805x453.jpg	Frente	0	2026-03-07 00:38:46.412
cmmfli0ek000xibnwizqj6cxu	cmmfli0ek000sibnw1y5xo5eq	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-living2-805x453.jpg	Living 1	1	2026-03-07 00:38:46.412
cmmfli0ek000yibnwp84olq5q	cmmfli0ek000sibnw1y5xo5eq	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-parrilla-balcon-lg-805x453.jpg	Parrilla/Balcon	2	2026-03-07 00:38:46.412
cmmfli0ek000zibnwbu23lr8u	cmmfli0ek000sibnw1y5xo5eq	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-dormitorio-LG-805x453.jpg	Dormitorio	3	2026-03-07 00:38:46.412
cmmfli0ek0010ibnwwi7012e8	cmmfli0ek000sibnw1y5xo5eq	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa2-bano-lg-805x453.jpg	Bano	4	2026-03-07 00:38:46.412
cmmfli0ek0011ibnw0h4sb73v	cmmfli0ek000sibnw1y5xo5eq	image	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/living-lcd-805x453.jpg	Living LCD	5	2026-03-07 00:38:46.412
\.


--
-- Data for Name: mensajes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mensajes (id, conversacion_id, tipo, direccion, origen, contenido, metadata, wa_message_id, creado_en) FROM stdin;
cmm47wuta0004ibr8u1kmzhz0	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	Hola	\N	sim_in_1772155976341	2026-02-27 01:32:56.446
cmm47wutt0006ibr8yfx9tfxg	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Mensaje recibido. Pronto te responderemos.	\N	\N	2026-02-27 01:32:56.465
cmm47zudo0004ibko405tdb9g	cmm47zucq0002ibko6rop674m	text	entrante	huesped	Tienen disponibilidad para el 15 de marzo?	\N	sim_in_1772156115763	2026-02-27 01:35:15.852
cmm47zuey0006ibko1002bw4f	cmm47zucq0002ibko6rop674m	text	saliente	bot	Para consultar disponibilidad, necesito que me indiques las fechas de entrada y salida, y el numero de personas. ¿Me las puedes facilitar?	{"intent": "consulta_disponibilidad", "entities": {}, "confidence": 0.7}	\N	2026-02-27 01:35:15.898
cmm47zv8m000bibkoguaqatgw	cmm47zv820009ibko3beup784	text	entrante	huesped	Quiero hablar con una persona por favor	\N	sim_in_1772156116921	2026-02-27 01:35:16.966
cmm47zv9m000dibkowxsgh7ri	cmm47zv820009ibko3beup784	text	saliente	bot	Perfecto, vamos a gestionar tu reserva. Necesito: 1) Fechas de entrada y salida, 2) Numero de personas, 3) Preferencia de habitacion. ¿Me facilitas estos datos?	{"intent": "reservar", "entities": {}, "confidence": 0.7}	\N	2026-02-27 01:35:17.002
cmm77628y0001ibw0bat73pcc	cmm47zv820009ibko3beup784	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-01 03:35:24.896
cmm7762cz0003ibw019h8fuw3	cmm47zv820009ibko3beup784	text	saliente	agente	Hola, soy un agente. En que puedo ayudarte?	\N	\N	2026-03-01 03:35:25.043
cmm7762hd0005ibw0hxt7kebp	cmm47zv820009ibko3beup784	system	saliente	sistema	Conversacion devuelta al bot	\N	\N	2026-03-01 03:35:25.201
cmmf9tvzb0001ibhswsbhoisy	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola	\N	sim_in_1772824325140	2026-03-06 19:12:05.157
cmmf9tw090003ibhs4fxg1gg1	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Hola! Bienvenido a Casa Rural El Encinar. Estamos en la Sierra de Gredos, Avila. ¿En que puedo ayudarte? Puedo informarte sobre disponibilidad, precios, servicios o actividades en la zona.	{"intent": "saludo", "entities": {}, "confidence": 0.8}	\N	2026-03-06 19:12:05.193
cmmf9u5ci0005ibhsmlsz7jpy	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	tenes disponiblidad para marzo ?	\N	sim_in_1772824337280	2026-03-06 19:12:17.298
cmmf9u5db0007ibhsmpbpq755	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para consultar disponibilidad, necesito que me indiques las fechas de entrada y salida, y el numero de personas. ¿Me las puedes facilitar?	{"intent": "consulta_disponibilidad", "entities": {}, "confidence": 0.7}	\N	2026-03-06 19:12:17.327
cmmf9up000009ibhssjy8wbrv	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	si ingreso 10 de marzo y salida 15 de marzo 3 personas	\N	sim_in_1772824362750	2026-03-06 19:12:42.769
cmmf9up0l000bibhsgf20uvzl	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Gracias por tu mensaje. Puedo ayudarte con informacion sobre disponibilidad, precios, servicios del alojamiento o actividades en la zona. ¿Que te gustaria saber?	{"intent": "otro", "entities": {}, "confidence": 0.5}	\N	2026-03-06 19:12:42.789
cmmf9v2jg000dibhsnvvuf9m8	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	tarifas y disponibilidad	\N	sim_in_1772824380297	2026-03-06 19:13:00.316
cmmf9v2jy000fibhsui7l0jct	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para consultar disponibilidad, necesito que me indiques las fechas de entrada y salida, y el numero de personas. ¿Me las puedes facilitar?	{"intent": "consulta_disponibilidad", "entities": {}, "confidence": 0.7}	\N	2026-03-06 19:13:00.334
cmmf9va2u000hibhsp8ctu755	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	si ingreso 10 de marzo y salida 15 de marzo 3 personas	\N	sim_in_1772824390069	2026-03-06 19:13:10.086
cmmf9va3f000jibhs9zk3w5xy	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Gracias por tu mensaje. Puedo ayudarte con informacion sobre disponibilidad, precios, servicios del alojamiento o actividades en la zona. ¿Que te gustaria saber?	{"intent": "otro", "entities": {}, "confidence": 0.5}	\N	2026-03-06 19:13:10.107
cmmfalkzo0001iblsvqee79w2	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola	\N	sim_in_1772825617229	2026-03-06 19:33:37.281
cmmfalnwy0003iblsv0j4qnl0	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En que puedo ayudarte hoy? Puedo brindarte informacion sobre disponibilidad, precios, servicios o actividades en la zona.	{"intent": "saludo", "entities": {}, "confidence": 0.8}	\N	2026-03-06 19:33:41.074
cmmfalwho0005iblsyg5fed6z	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	tarifas para 15 de marzo 3 personas	\N	sim_in_1772825632165	2026-03-06 19:33:52.188
cmmfam0wg0007iblspncemi2j	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para 3 personas del 10 al 15 de marzo (5 noches) en temporada baja, te recomiendo:\n\n**Departamento Marea** (2-4 personas): $45.000 x 5 noches = $225.000 ARS\n**Departamento Coral** (4-6 personas): $65.000 x 5 noches = $325.000 ARS\n\nAmbos tienen cocina equipada, aire acondicionado, Wi-Fi y ropa de cama incluida. El Coral tiene 2 dormitorios, balcón con parrilla y estacionamiento cubierto. ¿Te interesa reservar alguno?	{"intent": "consulta_precio", "entities": {}, "confidence": 0.7}	\N	2026-03-06 19:33:57.905
cmmfazabz0001ib5cl5sc4fjv	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola quiero consultar por alquiler en las grutas	\N	sim_in_1772826256625	2026-03-06 19:44:16.651
cmmfazdt10003ib5c988tlzv4	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. Con gusto te ayudo con el alquiler. \n\nTenemos 4 opciones disponibles: monoambientes y departamentos de 2 ambientes, todos cerca de la playa, con aire acondicionado, Wi-Fi y totalmente equipados.\n\nPara darte disponibilidad y tarifas exactas, necesito saber: ¿Para que fechas buscas alojamiento y cuantas personas son?	{"intent": "saludo", "entities": {}, "confidence": 0.8}	\N	2026-03-06 19:44:21.154
cmmfb02xp0005ib5ctzox7a1t	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	3 personas para 15 de marzo	\N	sim_in_1772826293706	2026-03-06 19:44:53.725
cmmfb06kw0007ib5cdwd8a74v	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, para 3 personas el 15 de marzo. ¿Cuantas noches te quedarias? Necesito la fecha de salida para consultar disponibilidad y darte el precio exacto.\n\nTenemos opciones que te pueden servir:\n- **Monoambiente Luminar** (hasta 3 personas)\n- **Departamentos de 2 ambientes** (hasta 4 personas)\n\nTodos a pocas cuadras de la playa con todo lo necesario para tu estadia.	{"intent": "otro", "entities": {}, "confidence": 0.5}	\N	2026-03-06 19:44:58.448
cmmfb0d5v0009ib5corkx849l	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	4 noches	\N	sim_in_1772826306961	2026-03-06 19:45:06.98
cmmfe4ugb000yibfso227bh8s	cmmfe4rpw000sibfsj29p5nzn	text	saliente	bot	¡Por supuesto! Te voy a contactar con un agente de atención para que te ayude personalmente.\n\nPodés comunicarte directamente por:\n- WhatsApp/Teléfono: +54 2920 561033\n- Email: lasgrutasdepartamentos@gmail.com\n\nUn integrante de nuestro equipo se pondrá en contacto con vos a la brevedad para ayudarte con lo que necesites.	{"intent": "hablar_humano", "entities": {}, "confidence": 0.95}	\N	2026-03-06 21:12:34.859
cmmfb0hdw000bib5cnsvzq2pn	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Genial, para 3 personas del 15 al 19 de marzo (4 noches) en temporada baja, tengo estas opciones:\n\n**Complejo Luminar - Monoambiente**: hasta 3 personas, $35.000 x 4 noches = $140.000 ARS\n- Cama doble + sofá cama, cocina completa, aire, Wi-Fi, estacionamiento cubierto\n- A 2 cuadras de la playa\n\n**Departamentos 2 ambientes** (Luminar/LG): hasta 4 personas, desde $45.000 x 4 noches = $180.000 ARS\n- 1 dormitorio + living con sofá cama, parrilla, más espacio\n\n¿Cuál te interesa o necesitas más detalles?	{"intent": "otro", "entities": {}, "confidence": 0.5}	\N	2026-03-06 19:45:12.45
cmmfb2u060001ibrc8zuqyfi1	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	queria consultar por precio para 3 personas en pewmafe	\N	sim_in_1772826422091	2026-03-06 19:47:02.118
cmmfb2y600003ibrcyz44w1gu	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para **Departamento Pewmafe** con 3 personas, el precio por noche es:\n\n**$70.000 ARS** (marzo está en temporada baja)\n\nEl Pewmafe es ideal para vos: 2 ambientes, capacidad hasta 4 personas, a solo 2 cuadras de la playa (bajada La Rinconada). Tiene cama matrimonial, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio con parrilla individual y cochera.\n\n¿Para cuántas noches lo necesitas? Así te paso el total y verifico disponibilidad para el 15 de marzo.	{"intent": "consulta_precio", "entities": {"habitacion": "Pewmafe", "num_personas": "3"}, "confidence": 0.95}	\N	2026-03-06 19:47:07.512
cmmfb38310005ibrc9enlh9fr	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	5 noches	\N	sim_in_1772826440340	2026-03-06 19:47:20.365
cmmfb3bri0007ibrcbgez3is7	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, para 3 personas del 15 al 20 de marzo (5 noches) en temporada baja, te recomiendo:\n\n**Monoambiente Luminar**: $65.000 x 5 noches = $325.000 ARS\n- Hasta 3 personas, a 2-3 cuadras de la playa\n- Aire acondicionado, Wi-Fi, cocina completa, estacionamiento cubierto\n\n**Departamento Pewmafe (2 ambientes)**: $70.000 x 5 noches = $350.000 ARS  \n- Hasta 4 personas, a 2 cuadras de la playa\n- 1 dormitorio, patio con parrilla individual, cochera\n\n¿Te interesa alguna de estas opciones o querés más información?	{"intent": "consulta_disponibilidad", "entities": {"num_noches": 5}, "confidence": 0.6}	\N	2026-03-06 19:47:25.135
cmmfb3i6l0009ibrce06qkt0f	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	me pasas fotos	\N	sim_in_1772826453437	2026-03-06 19:47:33.454
cmmfb3mf6000bibrcypmfbgl5	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Claro, te paso las fotos de nuestros departamentos:\n\n**Pewmafe** (2 ambientes, hasta 4 personas):\n- Frente: https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\n- Living: https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\n- Patio/Parrilla: https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/patio-parri-805x453.jpg\n\n**Luminar Monoambiente** (hasta 3 personas):\n- Interior: https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0011-805x453.jpg\n\n**Departamentos LG** (2 ambientes, hasta 4 personas):\n- Frente: https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/frente-lg-805x453.jpg\n- Living: https://www.lasgrutasdepartamentos.com	{"intent": "consulta_alojamiento", "entities": {}, "confidence": 0.85}	\N	2026-03-06 19:47:38.944
cmmfb7wsw0001ibq4ms7fg7pv	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola tarifas para LG marzo 15 3 personas 3 noches	\N	sim_in_1772826658997	2026-03-06 19:50:59.024
cmmfb80o30003ibq4dhxdgjp1	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para el **Departamento LG** del 15 al 18 de marzo (3 noches), para 3 personas:\n\n**Tarifa:** $80.000 por noche (temporada baja)\n**Total:** $240.000 ARS\n\nEl depto tiene 50m², 1 dormitorio con cama queen + sofá cama, aire acondicionado, Smart TV, Wi-Fi, cocina completa, parrilla, solarium y cochera cubierta. Está a 2 cuadras del mar (bajada Los Acantilados).\n\n¿Te interesa reservar o querés ver fotos del departamento?	{"intent": "consulta_precio", "entities": {"habitacion": "LG", "fecha_salida": "2026-03-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.9}	\N	2026-03-06 19:51:04.036
cmmfb89zd0005ibq4ovup6d9h	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	me envias fotos ?	\N	sim_in_1772826676085	2026-03-06 19:51:16.105
cmmfb8dzl0007ibq4tai8egd3	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Claro! Para enviarte las fotos correctas, ¿cual de los departamentos te interesa ver?\n\n- **Pewmafe** (2 amb, hasta 4 personas, a 2 cuadras playa, patio y parrilla individual)\n- **Luminar Monoambiente** (hasta 3 personas, a 2-3 cuadras playa, solarium)\n- **Luminar 2 Ambientes** (hasta 4 personas, a 2 cuadras playa, patio con parrilla)\n- **Departamentos LG** (2 amb, hasta 4 personas, a 2 cuadras playa, solarium y parrilla)\n\n¿De cual queres ver las fotos?	{"intent": "consulta_alojamiento", "entities": {}, "confidence": 0.8}	\N	2026-03-06 19:51:21.297
cmmfbad240009ibq44afwp5f3	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	LG	\N	sim_in_1772826773387	2026-03-06 19:52:53.404
cmmfbagzn000bibq45yyv88xy	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, el **Departamento LG** es excelente para 3 personas. Está a 2 cuadras del mar, tiene 50 m², dormitorio con cama queen, sofá cama en el living, cocina completa, aire acondicionado, parrilla y estacionamiento cubierto.\n\nPara darte disponibilidad y precio exacto, ¿cuántas noches te quedarías desde el 15 de marzo? La estadía mínima es de 5 noches.\n\nEn temporada baja (marzo) la tarifa es **$80.000 por noche**.	{"intent": "consulta_alojamiento", "entities": {"habitacion": "LG"}, "confidence": 0.7}	\N	2026-03-06 19:52:58.498
cmmfban5b000dibq4f9sh0z7h	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	ENVIAR FOTOS DE LG	\N	sim_in_1772826786463	2026-03-06 19:53:06.479
cmmfbaqpl000fibq4sz4hv4y6	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Acá te envío las fotos del Departamento LG:\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/frente-lg-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-living2-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-dormitorio-LG-805x453.jpg\n\nEl Departamento LG tiene 50m2, aire acondicionado, Wi-Fi, parrilla, balcón con solarium y cochera cubierta. Está a 2 cuadras de la bajada Los Acantilados. ¿Te gustaría que te confirme disponibilidad para el 15 de marzo?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "LG"}, "confidence": 0.85}	\N	2026-03-06 19:53:11.098
cmmfbcnoa0001ib80i1zn9ug2	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	consulta pewmafe 3 personas 15 de marzo 3 noches	\N	sim_in_1772826880441	2026-03-06 19:54:40.474
cmmfe36yw000iibfsdsuu9d2y	cmmfe332g000eibfs1gkv1hyl	text	saliente	bot	¡Hola! Sí, tengo excelentes noticias: Pewmafe está disponible del 15 al 18 de abril 2026.\n\nSerían 3 noches en temporada baja, con un costo total de $210.000 ARS ($70.000 por noche).\n\nEl departamento está a solo 2 cuadras de la playa, tiene capacidad para hasta 4 personas, cocina equipada, aire acondicionado, Wi-Fi, patio con parrilla individual y cochera.\n\n¿Te gustaría confirmar la reserva o necesitás algún dato más?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-18", "fecha_entrada": "2026-04-15"}, "confidence": 0.95}	\N	2026-03-06 21:11:17.769
cmmfbcs670003ib80olicdz8o	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, consulto **Departamento Pewmafe** para 3 personas del 15 al 18 de marzo (3 noches).\n\n**Tarifa temporada baja:** $70.000 por noche\n**Total 3 noches:** $210.000 ARS\n\nEl Pewmafe esta a 2 cuadras de la playa, tiene capacidad para 4 personas, 1 dormitorio con cama matrimonial, living con sofa cama, bano completo, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio con parrilla individual y cochera.\n\nIncluye ropa de cama y toallas. Check-in 14hs, check-out 10hs.\n\n¿Te gustaria ver fotos del departamento o confirmar la reserva?	{"intent": "consulta_precio", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-06 19:54:46.304
cmmfbd5a20005ib806cx4ight	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	me envias fotos	\N	sim_in_1772826903267	2026-03-06 19:55:03.29
cmmfbd8r10007ib80qp4msphr	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Claro, con gusto te envío fotos. ¿De cuál departamento te gustaría ver? Tenemos:\n\n1. **Pewmafe** (2 ambientes, hasta 4 personas)\n2. **Luminar Monoambiente** (hasta 3 personas)\n3. **Luminar 2 Ambientes** (hasta 4 personas)\n4. **Departamentos LG** (2 ambientes, hasta 4 personas)\n\nComo son 3 personas, el monoambiente o cualquiera de los de 2 ambientes les vendría bien. ¿De cuál querés ver fotos?	{"intent": "consulta_alojamiento", "entities": {"num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.85}	\N	2026-03-06 19:55:07.789
cmmfbfbp00001ibi0d3i41n5d	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	departamento pewmafe 3 personas del 15 de marzo disponibilidad y precios	\N	sim_in_1772827004897	2026-03-06 19:56:44.917
cmmfbffqb0003ibi0krjs4xtj	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Consultando disponibilidad del **Departamento Pewmafe** para 3 personas desde el 15 de marzo...\n\n¿Cuantas noches te quedarias? Necesito la fecha de salida para confirmar disponibilidad y calcular el precio total.\n\nMientras tanto te cuento que Pewmafe es un departamento de 2 ambientes para hasta 4 personas, a 2 cuadras de la playa (bajada La Rinconada), con aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio individual con parrilla y cochera. \n\nLa tarifa por noche en marzo es de **$70.000 ARS** (temporada baja).	{"intent": "consulta_precio", "entities": {"habitacion": "Pewmafe", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-06 19:56:50.146
cmmfbfmbk0005ibi0qx8iicxw	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	enviame fotos	\N	sim_in_1772827018666	2026-03-06 19:56:58.688
cmmfbfqhd0007ibi0liex181f	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Te envio las fotos de nuestras opciones para 3 personas:\n\n**Monoambiente Luminar:**\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0011-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0010-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0012-805x453.jpg\n\n**Departamento Pewmafe (2 ambientes):**\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/frente-1-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/doritorio-805x453.jpg\n\n¿Cuantas noches te quedarias para darte disponibilidad y precio exacto?	{"intent": "consulta_alojamiento", "entities": {"num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-06 19:57:04.081
cmmfbj2gu0001ibosm89zfggd	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	consulta alojamiento pewmafe para 15 de marzo 3 personas	\N	sim_in_1772827179557	2026-03-06 19:59:39.582
cmmfbj7li0003ibosn492lqbc	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	El **Departamento Pewmafe** es ideal para 3 personas. Te cuento sus características:\n\n📍 **Ubicación:** Punta Perdices 370, a solo 2 cuadras de la playa (bajada La Rinconada)\n\n🏠 **Capacidades:** 2 ambientes, hasta 4 personas\n- 1 dormitorio con cama matrimonial\n- Sofá cama en living\n- Baño completo con bidet y ducha\n\n✨ **Servicios:** Aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio individual con parrilla, cochera, ropa de cama y toallas incluidas\n\n💰 **Tarifa marzo (temp. baja):** $70.000 por noche\n\n¿Cuántas noches necesitarías para darte el precio total?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.85}	\N	2026-03-06 19:59:46.23
cmmfbjl7h0005ibosw7edyg6e	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	3 noches, ok que ubicacion tiene ?	\N	sim_in_1772827203848	2026-03-06 20:00:03.87
cmmfbjpva0007ibosrsfmsjo3	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para 3 personas, 3 noches desde el 15 de marzo (2026) en temporada baja, tenemos estas opciones:\n\n**Monoambiente Luminar** - $65.000/noche = $195.000 total\n📍 Golfo San Jorge 560 - a 2-3 cuadras de la playa (bajada Los Acantilados)\n\n**Departamento Pewmafe** - $70.000/noche = $210.000 total  \n📍 Punta Perdices 370 - a 2 cuadras de la playa (bajada La Rinconada)\n\n**Departamento Luminar 2 Ambientes** - $70.000/noche = $210.000 total\n📍 Golfo San Jorge 560 - a 2 cuadras de la playa (bajada Los Acantilados)\n\nTodos tienen cocina completa, aire acondicionado, Wi-Fi y ropa de cama incluida. ¿Te interesa conocer más detalles de alguno en particular?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-06 20:00:09.911
cmmfbkkoh0009ibos8ox06yvw	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	enviame fotos	\N	sim_in_1772827249823	2026-03-06 20:00:49.841
cmmfbkp02000biboscqmnwvmn	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Para enviarte las fotos correctas, ¿de cual departamento te gustaria ver fotos?\n\nTenemos:\n- **Pewmafe** (2 ambientes, hasta 4 personas)\n- **Luminar Monoambiente** (hasta 3 personas)\n- **Luminar 2 Ambientes** (hasta 4 personas)\n- **Departamentos LG** (2 ambientes, hasta 4 personas)\n\n¿Cual te interesa conocer?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.9}	\N	2026-03-06 20:00:55.442
cmmfbkupb000dibosy82gifs0	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	pewmfae	\N	sim_in_1772827262816	2026-03-06 20:01:02.831
cmmfbkyuj000fibosp179ehv8	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, te consulto por **Pewmafe** para 3 personas desde el 15 de marzo. ¿Hasta que fecha seria tu estadia? Necesito saber cuantas noches para darte el precio total.\n\n**Pewmafe** es un departamento de 2 ambientes ideal para tu grupo:\n- Capacidad hasta 4 personas\n- A solo 2 cuadras de la playa (bajada La Rinconada)\n- Aire acondicionado, Smart TV, Wi-Fi\n- Cocina equipada, patio y parrilla individual\n- Cochera propia	{"intent": "consulta_precio", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.85}	\N	2026-03-06 20:01:08.201
cmmfdhgkr0001iba0tu1ojozm	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	info alojamiento pewmafe	\N	sim_in_1772830463726	2026-03-06 20:54:23.78
cmmfe4di9000nibfs37oll96u	cmmfe4dhu000libfsejkaje0b	text	entrante	huesped	necesito 3 noches desde el 15 de abril en Pewmafe	\N	sim_in_1772831532859	2026-03-06 21:12:12.898
cmmfdhlye0003iba09tasvgio	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	**Departamento Pewmafe** es ideal para vos:\n\n📍 Punta Perdices 370, a solo 2 cuadras de la playa (bajada La Rinconada)\n👥 Capacidad: hasta 4 personas\n🛏️ 1 dormitorio con cama matrimonial + living con sofá cama\n🚿 Baño completo con ducha y bidet\n\n**Comodidades:**\nAire acondicionado, Smart TV, Wi-Fi, cocina totalmente equipada, patio individual con parrilla, estacionamiento (cochera). Ropa de cama y toallas incluidas.\n\n**Tarifas por noche:**\n- Temp. Baja (marzo-junio): $70.000\n- Temp. Media (julio, 1-14 dic): $90.000\n- Temp. Alta (15 dic-feb): $120.000\n\n¿Cuantas noches necesitas para marzo?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-06 20:54:30.759
cmmfdi54x0005iba0teixsdlb	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	necesito para abril 3 noches desde 15 de abril	\N	sim_in_1772830495601	2026-03-06 20:54:55.617
cmmfdi9kb0007iba03cd5gafu	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Genial, para 3 personas del 15 al 18 de abril (3 noches). Abril esta en temporada baja, asi que tenes buenas tarifas.\n\nTe recomiendo el **Departamento Pewmafe** (hasta 4 personas):\n- Tarifa: $70.000 por noche = **$210.000 total** (3 noches)\n- A 2 cuadras de la playa\n- 1 dormitorio con cama matrimonial\n- Aire acondicionado, Smart TV, Wi-Fi\n- Cocina equipada, patio con parrilla individual\n- Cochera incluida\n\n¿Te gustaria ver fotos o reservarlo?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-18", "num_personas": "3", "fecha_entrada": "2026-04-15"}, "confidence": 0.95}	\N	2026-03-06 20:55:01.355
cmmfdj2zx0009iba0m1k4a4h1	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	me envias fotos	\N	sim_in_1772830539483	2026-03-06 20:55:39.502
cmmfdj7qw000biba0joa9xbj6	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Te envio fotos del **Departamento Pewmafe** (2 ambientes, hasta 4 personas, a 2 cuadras de la playa):\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg\n\nTiene dormitorio con cama matrimonial, cocina equipada, aire acondicionado, Smart TV, Wi-Fi, patio con parrilla individual y cochera. ¿Te gustaria ver mas fotos o consultar la tarifa para tus fechas?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-18", "num_personas": "3", "fecha_entrada": "2026-03-15"}, "confidence": 0.85}	\N	2026-03-06 20:55:45.657
cmmfdqbj70001ibs40tirgwb0	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	quiero informacion de alojamiento en las grutas	\N	sim_in_1772830875702	2026-03-06 21:01:17.154
cmmfdqg2l0003ibs442jgjr89	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Con gusto te cuento sobre nuestro alojamiento en Las Grutas. Estamos a 2 cuadras de la playa (bajada La Rinconada) y tenemos departamentos equipados para tu comodidad.\n\n**Departamento Pewmafe** que estamos ofreciendo:\n- 2 ambientes, capacidad hasta 4 personas\n- 1 dormitorio con cama matrimonial\n- Aire acondicionado, Smart TV, Wi-Fi\n- Cocina totalmente equipada\n- Patio individual con parrilla propia\n- Cochera para tu auto\n- Ropa de cama y toallas incluidas\n\n**Tarifas por noche:**\n- Temp. Baja (marzo-junio): $70.000\n- Temp. Media (julio): $90.000\n- Temp. Alta (dic-feb): $120.000\n\n¿Te gustaria ver fotos o necesitas mas informacion sobre servicios?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.85}	\N	2026-03-06 21:01:23.033
cmmfe0eqm0001ibzks76jd1se	cmm47zucq0002ibko6rop674m	text	entrante	huesped	Hola, quiero informacion de alojamiento en Las Grutas	\N	sim_in_1772831347842	2026-03-06 21:09:07.87
cmmfe0ieo0003ibzkbb60pmgz	cmm47zucq0002ibko6rop674m	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos.\n\nTenemos varios departamentos disponibles en Las Grutas, todos equipados con aire acondicionado, Wi-Fi, cocina completa y estacionamiento. Para poder recomendarte la mejor opcion, necesito saber: ¿cuantas personas van a viajar, que fechas tienen pensadas y cuantas noches se van a quedar?\n\nAsi puedo mostrarte las opciones que mejor se ajusten a lo que necesitas.	{"intent": "consulta_alojamiento", "entities": {"zona": "Las Grutas"}, "confidence": 0.8}	\N	2026-03-06 21:09:12.624
cmmfe1n5t0001ibfsdytj6305	cmm47zucq0002ibko6rop674m	text	entrante	huesped	Hola, quiero informacion de alojamiento en Las Grutas	\N	sim_in_1772831405414	2026-03-06 21:10:05.441
cmmfe1pd80003ibfsv7ra93ds	cmm47zucq0002ibko6rop674m	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos.\n\nTenemos varios departamentos disponibles en Las Grutas, todos equipados con aire acondicionado, Wi-Fi, cocina completa y estacionamiento. Para poder recomendarte la mejor opcion, necesito saber: ¿cuantas personas van a viajar, que fechas tienen pensadas y cuantas noches se van a quedar?\n\nAsi puedo mostrarte las opciones que mejor se ajusten a lo que necesitas.	{"intent": "consulta_alojamiento", "entities": {}, "confidence": 0.95}	\N	2026-03-06 21:10:08.3
cmmfe23hl0005ibfsm3s1wxpv	cmm47zv820009ibko3beup784	text	entrante	huesped	Hola, me interesa el departamento Pewmafe	\N	sim_in_1772831426587	2026-03-06 21:10:26.601
cmmfe27w20007ibfskvhuxrip	cmm47zv820009ibko3beup784	text	saliente	bot	¡Hola! Perfecto, te cuento sobre Pewmafe.\n\nEs un departamento de 2 ambientes ideal para hasta 4 personas, ubicado a solo 2 cuadras de la playa (bajada La Rinconada). Tiene 1 dormitorio con cama matrimonial, baño completo, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio individual con parrilla y cochera.\n\nPara poder ayudarte mejor: ¿cuántas personas viajan, qué fechas necesitarías y cuántas noches pensaban quedarse?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95}	\N	2026-03-06 21:10:32.306
cmmfe2iqz0009ibfsntcwykef	cmm47zv820009ibko3beup784	text	entrante	huesped	pasame fotos	\N	sim_in_1772831446365	2026-03-06 21:10:46.38
cmmfe2mj2000bibfs5h2n871x	cmm47zv820009ibko3beup784	text	saliente	bot	Te paso las fotos principales de Pewmafe:\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg\n\nTambién podés ver más fotos y un video tour completo acá:\n\nhttps://www.lasgrutasdepartamentos.com/properties/pewmafe/\n\n¿Te gustaría saber disponibilidad y precios para alguna fecha en particular?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95}	\N	2026-03-06 21:10:51.278
cmmfe3335000gibfsr4c3yo6o	cmmfe332g000eibfs1gkv1hyl	text	entrante	huesped	hay disponibilidad del 15 al 18 de abril en Pewmafe?	\N	sim_in_1772831472691	2026-03-06 21:11:12.737
cmmfe4ufm000wibfsf8io64vy	cmmfe4rpw000sibfsj29p5nzn	system	saliente	sistema	Huesped solicito hablar con un agente	\N	\N	2026-03-06 21:12:34.834
cmmfkg6px000cibxgdy5j8st7	cmmfkf8qk0002ibxgub2m4h72	text	entrante	huesped	del 10 al 15 de abril	\N	sim_in_1772842161648	2026-03-07 00:09:21.67
cmmi2k7rc00n2ibqc0b8kzvrj	cmmi2k7qz00n0ibqc8r1dvc3f	text	entrante	huesped	hola	\N	sim_in_1772993515050	2026-03-08 18:11:55.081
cmmfe4i5e000pibfsjq1glpir	cmmfe4dhu000libfsejkaje0b	text	saliente	bot	¡Perfecto! Te confirmo que **Pewmafe está disponible** del 15 al 18 de abril (3 noches).\n\nEl costo total sería de **$210.000 ARS** (temporada baja: $70.000 por noche).\n\nEl departamento tiene capacidad para hasta 4 personas, cuenta con 1 dormitorio matrimonial, living-comedor, cocina equipada, baño completo, aire acondicionado, Wi-Fi, Smart TV, patio con parrilla individual y cochera. Está a solo 2 cuadras de la playa.\n\n¿Te gustaría confirmar la reserva o necesitás más información?	{"intent": "consulta_disponibilidad", "entities": {"noches": 3, "habitacion": "Pewmafe", "fecha_salida": "2026-04-18", "fecha_entrada": "2026-04-15"}, "confidence": 0.95}	\N	2026-03-06 21:12:18.914
cmmfe4rqk000uibfsabzk8m37	cmmfe4rpw000sibfsj29p5nzn	text	entrante	huesped	quiero hablar con una persona	\N	sim_in_1772831551268	2026-03-06 21:12:31.341
cmmfe5pne0013ibfsq2d9m250	cmmfe5pmn0011ibfsdybe9w0e	text	entrante	huesped	somos 2 personas, necesitamos 3 noches desde el 20 de julio	\N	sim_in_1772831595243	2026-03-06 21:13:15.29
cmmfe6mzo001gibfs568252ka	cmmfe6kqr001cibfsesgylv1j	text	saliente	bot	¡De nada! Fue un placer ayudarte.\n\nSi tenes cualquier otra consulta, no dudes en escribirnos. ¡Que tengas un excelente dia!\n\nSaludos,\nLas Grutas Departamentos	{"intent": "despedida", "entities": {}, "confidence": 0.95}	\N	2026-03-06 21:13:58.5
cmmi2k9qt00n4ibqccaungn9q	cmmi2k7qz00n0ibqc8r1dvc3f	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos 👋\n\n¿En qué puedo ayudarte hoy? Podemos consultar disponibilidad, precios o cualquier información sobre nuestros departamentos en Las Grutas.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 18:11:57.653
cmmi2kh3u00n6ibqc9452d8s8	cmmi2k7qz00n0ibqc8r1dvc3f	text	entrante	huesped	quiero consultar para mañana somos 2 personas buscamos cerca de la playa	\N	sim_in_1772993527186	2026-03-08 18:12:07.195
cmmi2year00obibqcv4dijuma	cmmi2yaos00o7ibqcs09s3b0h	text	saliente	bot	Hola! ¿Cómo andás? Para abril del 2025 o 2026 necesitás? Te pregunto para chequear la disponibilidad exacta y los precios correspondientes.	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-04-10", "num_personas": "4", "fecha_entrada": "2026-04-07"}, "confidence": 0.95}	\N	2026-03-08 18:22:56.739
cmmi2ylig00ogibqcqu7wdb4r	cmmi2ylhz00oeibqcdpy0g9gp	text	entrante	huesped	Hola, tienen disponibilidad en el departamento Premium Suite?	\N	sim_in_1772994186049	2026-03-08 18:23:06.089
cmmi2zmos00p3ibqcufcsmqzv	cmmi2zhyv00ozibqcdwo3vzpy	text	saliente	bot	Hola! Gracias por contactarte con Las Grutas Departamentos.\n\nVeo que querés reservar el departamento LG para 2 personas, pero hay un detalle con las fechas: me indicás del 20 al 15 de mayo, y la fecha de salida (15) es anterior a la de entrada (20). ¿Podrías confirmarme las fechas correctas? Por ejemplo, ¿es del 15 al 20 de mayo, o del 20 al 25 de mayo?\n\nUna vez que me confirmes, te paso el precio total y los pasos para confirmar tu reserva.	{"intent": "reservar", "entities": {"habitacion": "LG", "fecha_salida": "2026-05-20", "num_personas": "2", "fecha_entrada": "2026-05-15"}, "confidence": 0.95}	\N	2026-03-08 18:23:54.268
cmmi2zssh00p8ibqc6cw1d0hc	cmmi2zss700p6ibqccqcx4zup	text	entrante	huesped	Hola, cuanto cuesta LG del 10 al 13 de abril para 2 personas?	\N	sim_in_1772994242153	2026-03-08 18:24:02.178
cmmi30hf600poibqcsw45zfjn	cmmi30efn00pkibqchm5c720j	text	saliente	bot	¡Perfecto! Te confirmo los datos de tu reserva:\n\n**Departamento:** Luminar 2Amb\n**Fecha de entrada:** 28 de marzo de 2026\n**Fecha de salida:** 31 de marzo de 2026\n**Noches:** 3\n**Personas:** 3\n**Precio total:** $210.000 ARS ($70.000 por noche)\n\nEl departamento está disponible para esas fechas. ¿Querés proceder con la pre-reserva?	{"intent": "reservar", "entities": {"habitacion": "Luminar 2Amb", "fecha_salida": "2026-03-31", "num_personas": "3", "fecha_entrada": "2026-03-28"}, "confidence": 0.95}	\N	2026-03-08 18:24:34.098
cmmi30p8z00ptibqcu35tqqmr	cmmi30p8t00pribqcmg69mcdt	text	entrante	huesped	Hola, somos 6 personas, que opciones hay del 23 de marzo al 26 de marzo?	\N	sim_in_1772994284227	2026-03-08 18:24:44.243
cmmju69j90001ibc4masijcin	cmmi2md3s00nkibqchwucs245	text	entrante	huesped	hola	\N	sim_in_1773100359571	2026-03-09 23:52:39.617
cmmju6cn20003ibc4ebalgo31	cmmi2md3s00nkibqchwucs245	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte? ¿Tenés alguna consulta sobre la pre-reserva del Luminar Mono que estábamos conversando, o preferís consultar por otra cosa?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-09 23:52:43.647
cmmju6u370009ibc4duarwshb	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	hola	\N	sim_in_1773100386209	2026-03-09 23:53:06.259
cmmjva6pq0009ibrcltrppkrd	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	8 personas	\N	sim_in_1773102222180	2026-03-10 00:23:42.206
cmmjvmwwb0001ibv80tv0d9yy	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	Hola quiero saber si pewmafe esta disponible del 11 al 15 de marzo para 4 personas	\N	sim_in_1773102815958	2026-03-10 00:33:36.011
cmmh208fr005uibakgxlvzosg	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772932116602	2026-03-08 01:08:36.663
cmmh25kg9006aibakkc3p2yq4	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772932365479	2026-03-08 01:12:45.513
cmmh25ndq006cibak0vx6rnw3	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola de nuevo! 😊\n\nSeguimos acá para ayudarte con tu consulta. Estábamos viendo opciones de alojamiento para 10 personas del 10 al 15 de marzo (5 noches).\n\n¿Te interesa alguna de las combinaciones de departamentos que te mencioné, o preferís que te cuente más detalles sobre alguno en particular?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 01:12:49.307
cmmh27q2i006oibaktu00rl1r	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola tenes disponible para mañana	\N	sim_in_1772932466083	2026-03-08 01:14:26.106
cmmh27sta006qibakolyx0zi0	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! Para poder verificar la disponibilidad para mañana, necesito que me digas:\n\n1. **¿Para cuántas personas?**\n2. **¿Cuántas noches te vas a quedar?**\n\nCon esos datos te confirmo qué departamentos tenemos disponibles.	{"intent": "consulta_disponibilidad", "entities": {"fecha_entrada": "2026-03-13"}, "confidence": 0.95}	\N	2026-03-08 01:14:29.663
cmmh281lz006sibakryb7gz9a	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	somos una pareja solo la noche de mañana	\N	sim_in_1772932481039	2026-03-08 01:14:41.063
cmmh286ba006uibakcsska3og	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Perfecto, entonces son **2 personas** para **1 noche** (mañana).\n\nLamentablemente, todos nuestros departamentos tienen una **estadía mínima** que no podemos ajustar:\n- **Pewmafe**: mínimo 2 noches\n- **Luminar Mono y Luminar 2Amb**: mínimo 4 noches  \n- **LG**: mínimo 5 noches\n\nTe sugiero que nos contactes directamente al **+54 2920 561033** (WhatsApp) para ver si hay alguna posibilidad especial, o podés considerar extender tu estadía para cumplir con el mínimo requerido.\n\n¿Te gustaría ver opciones para más noches?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-01-10", "num_personas": "2", "fecha_entrada": "2026-01-09"}, "confidence": 0.95}	\N	2026-03-08 01:14:47.159
cmmfe5vxr0015ibfswavohk57	cmmfe5pmn0011ibfsdybe9w0e	text	saliente	bot	¡Perfecto! Para 2 personas, 3 noches del 20 al 23 de julio de 2026, tengo estas opciones disponibles:\n\n**Departamentos Pewmafe** (2 ambientes, a 2 cuadras de la playa)\n$270.000 total ($90.000 por noche)\nAire acondicionado, Smart TV, Wi-Fi, patio con parrilla individual, cochera\nhttps://www.lasgrutasdepartamentos.com/properties/pewmafe/\n\n**Complejo Luminar Monoambiente** (a 2-3 cuadras del mar)\n$255.000 total ($85.000 por noche)\nAire acondicionado, TV cable, Wi-Fi, cocina completa, estacionamiento cubierto\nhttps://www.lasgrutasdepartamentos.com/properties/complejo-luminar-monoambiente/\n\n**Complejo Luminar 2 Ambientes** (a 2 cuadras de la playa)\n$270.000 total ($90.000 por noche)\nAire acondicionado, Smart TV, Wi-Fi, patio con parrilla, cochera cubierta\nhttps://www.lasgrutasdepartamentos.com/properties/complejo-luminar/\n\n**Departamentos LG** (a 2 cuadras del mar)\n$285.000 total ($95.000 por noche)\nAire acondicionado, TV LED, Wi-Fi, balcón con parrilla, cochera cubierta\nhttps://www.lasgrutasdepartamentos.com/properties/departamentos-lg/\n\n¿Alguno te interesa en particular o necesitas más información?	{"intent": "consulta_disponibilidad", "entities": {"num_noches": 3, "fecha_salida": "2026-07-23", "num_personas": 2, "fecha_entrada": "2026-07-20"}, "confidence": 0.95}	\N	2026-03-06 21:13:23.437
cmmfe656a0017ibfsj9tf31kn	cmmfe5pmn0011ibfsdybe9w0e	text	entrante	huesped	me interesa el Luminar Mono, pasame fotos	\N	sim_in_1772831615396	2026-03-06 21:13:35.411
cmmfe69a50019ibfsfap01lru	cmmfe5pmn0011ibfsdybe9w0e	text	saliente	bot	¡Dale! Te paso las fotos del Luminar Monoambiente:\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0011-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0010-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0012-805x453.jpg\n\nTambién podés ver el video tour completo acá:\nhttps://www.youtube.com/watch?v=sIBaRPlJYQk\n\nY más fotos en la página del departamento:\nhttps://www.lasgrutasdepartamentos.com/properties/complejo-luminar-monoambiente/\n\n¿Te gustaría reservarlo para el 20 al 23 de julio? El total sería $255.000 (3 noches x $85.000).	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Luminar Mono", "tipo_solicitud": "fotos"}, "confidence": 0.95}	\N	2026-03-06 21:13:40.729
cmmfe6krc001eibfs6wpw9m5z	cmmfe6kqr001cibfsesgylv1j	text	entrante	huesped	bueno gracias, adios!	\N	sim_in_1772831635562	2026-03-06 21:13:55.608
cmmfe995l0004ibrwawszpdcl	cmmfe99520002ibrwh66e0p2c	text	entrante	huesped	me interesa pewmafe	\N	sim_in_1772831760450	2026-03-06 21:16:00.537
cmmfe9dsm0006ibrwvbt9nfjh	cmmfe99520002ibrwh66e0p2c	text	saliente	bot	¡Perfecto! Pewmafe es un excelente departamento de 2 ambientes, ideal para 4 personas, ubicado a solo 2 cuadras de la playa en Punta Perdices 370.\n\nCuenta con 1 dormitorio con cama matrimonial, aire acondicionado, Smart TV, Wi-Fi, cocina totalmente equipada, patio individual con parrilla y estacionamiento. La ropa de cama y toallas están incluidas.\n\n¿Para cuántas personas estás buscando y qué fechas tenés pensadas? Así te paso la disponibilidad y la tarifa exacta.	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.85}	\N	2026-03-06 21:16:06.55
cmmfe9j860008ibrw88kdhuo5	cmmfe99520002ibrwh66e0p2c	text	entrante	huesped	pasame fotos	\N	sim_in_1772831773567	2026-03-06 21:16:13.591
cmmfe9m1j000aibrwnxownjxn	cmmfe99520002ibrwh66e0p2c	text	saliente	bot	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95}	\N	2026-03-06 21:16:17.236
cmmfehcua0004ib2w0n906yix	cmmfehcta0002ib2wrlacf4zy	text	entrante	huesped	hola me interesa pewmafe	\N	sim_in_1772832138466	2026-03-06 21:22:18.563
cmmfehh8q0006ib2wyiuypofu	cmmfehcta0002ib2wrlacf4zy	text	saliente	bot	¡Hola! ¿Cómo estás? Me alegra que te interese Pewmafe, es un departamento muy lindo y completo.\n\nEstá ubicado a solo 2 cuadras de la playa (bajada La Rinconada), tiene capacidad para hasta 4 personas, con 1 dormitorio matrimonial, living, cocina equipada, aire acondicionado, Smart TV, Wi-Fi, patio con parrilla individual y cochera propia.\n\nPara poder ayudarte mejor, ¿me contás para qué fechas necesitás alojamiento y cuántas personas viajan?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.85}	\N	2026-03-06 21:22:24.263
cmmfehknc0008ib2w9ax4rjl7	cmmfehcta0002ib2wrlacf4zy	text	entrante	huesped	pasame fotos	\N	sim_in_1772832148663	2026-03-06 21:22:28.68
cmmfehn0n000aib2wva97r34g	cmmfehcta0002ib2wrlacf4zy	text	saliente	bot	https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg\n\nhttps://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/doritorio-805x453.jpg	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95}	\N	2026-03-06 21:22:31.751
cmmfh2daf0004ibfk8e4b1qfd	cmmfh2d9q0002ibfkmfxxj0w5	text	entrante	huesped	hola me interesa pewmafe	\N	sim_in_1772836478032	2026-03-06 22:34:38.151
cmmfh2h060006ibfkma08mzvw	cmmfh2d9q0002ibfkmfxxj0w5	text	saliente	bot	¡Hola! ¿Cómo estás? Me alegra que te interese Pewmafe, es un departamento muy lindo y completo.\n\nEstá ubicado a solo 2 cuadras de la playa (bajada La Rinconada), tiene capacidad para 4 personas, con un dormitorio matrimonial, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio con parrilla individual y cochera.\n\nPara ayudarte mejor, ¿para qué fechas estás buscando y cuántas personas van a viajar?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.9}	\N	2026-03-06 22:34:42.967
cmmfh2l270008ibfkcgqwfwmj	cmmfh2d9q0002ibfkmfxxj0w5	text	entrante	huesped	pasame fotos	\N	sim_in_1772836488195	2026-03-06 22:34:48.222
cmmfh2lrs000aibfkk4zqc3ok	cmmfh2d9q0002ibfkmfxxj0w5	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-06 22:34:49.144
cmmfjxpcm000cibfk70373x3n	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	HOLA	\N	sim_in_1772841299329	2026-03-06 23:54:59.35
cmmfjxrxv000eibfkg85s67t7	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte? Estoy acá para informarte sobre nuestros departamentos en Las Grutas, disponibilidad, precios o lo que necesites saber.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-06 23:55:02.707
cmmfjy6e8000gibfkxo0b5all	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	me pasas disponibilidad y precios en marzo para 4 personas ?	\N	sim_in_1772841321423	2026-03-06 23:55:21.44
cmmh20b1e005wibakp1u8r1rx	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! Bienvenido/a a Las Grutas Departamentos 😊\n\n¿En qué puedo ayudarte? Podemos ver disponibilidad, precios, información sobre nuestros departamentos o lo que necesites para planificar tu estadía en Las Grutas.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 01:08:40.034
cmmfjya5l000iibfkn9wrlbeq	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, para 4 personas en marzo. Te consulto: ¿que fechas especificas de marzo necesitas (del X al X) y cuantas noches?\n\nMarzo esta en **temporada baja**, con las mejores tarifas. Tengo varias opciones que te pueden servir para 4 personas, pero necesito las fechas exactas para confirmarte disponibilidad y precio total.	{"intent": "consulta_precio", "entities": {"mes": "marzo", "habitacion": "Pewmafe", "num_personas": 4}, "confidence": 0.95}	\N	2026-03-06 23:55:26.314
cmmfjyucq000kibfkypiu6jza	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	seria del 10 de marzo hasta el 15 de marzo	\N	sim_in_1772841352472	2026-03-06 23:55:52.49
cmmfjyxta000mibfklcw4zp3s	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, del 10 al 15 de marzo (5 noches) para 3 personas en temporada baja. Te paso las opciones disponibles:\n\n**Monoambiente Luminar** (hasta 3 personas): $40.000 x 5 noches = $200.000 ARS\n- A 3 cuadras de la playa, aire acondicionado, cocina equipada, Wi-Fi\n\n**Departamento Pewmafe** (hasta 4 personas): $70.000 x 5 noches = $350.000 ARS\n- A 2 cuadras de la playa, 1 dormitorio, patio con parrilla individual, cochera\n\n¿Te interesa alguno en particular?	{"intent": "consulta_precio", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-15", "num_personas": 3, "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-06 23:55:56.975
cmmfk34w1000oibfk1ckeui5g	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	pewmafe	\N	sim_in_1772841552751	2026-03-06 23:59:12.769
cmmfk38me000qibfkbkhmvf5i	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Perfecto, el **Departamento Pewmafe** es ideal para 3 personas. Esta a solo 2 cuadras de la playa La Rinconada, tiene:\n\n- 1 dormitorio con cama matrimonial + sofa cama\n- Aire acondicionado, Smart TV, Wi-Fi\n- Cocina equipada, patio individual con parrilla\n- Cochera privada\n\nPara el 15 de marzo (temporada baja) la tarifa es **$70.000 por noche**. ¿Cuantas noches necesitas para pasarte el precio total?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "num_personas": 3, "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-06 23:59:17.606
cmmfk7f7j0001ibb0sprw5quj	cmm47wusm0002ibr8iv2c5rgs	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-07 00:02:32.766
cmmfk7opf0006ibb0vd9im8gm	cmmfk7oof0004ibb0pb3dwvrj	text	entrante	huesped	hola necesito alojamiento para 4 personas en marzo, precios?	\N	sim_in_1772841764999	2026-03-07 00:02:45.075
cmmfk7utw0008ibb0ag7x3yns	cmmfk7oof0004ibb0pb3dwvrj	text	saliente	bot	¡Hola! ¿Cómo estás? Te comento que para 4 personas en marzo (temporada baja) tenemos estas opciones:\n\n**Pewmafe** (2 ambientes, 1 dormitorio + living): $70.000 por noche\n- A 2 cuadras de la playa\n- Aire acondicionado, Smart TV, Wi-Fi\n- Patio individual con parrilla y cochera\n\n**Luminar 2 Ambientes** (1 dormitorio + living): $70.000 por noche\n- A 2 cuadras de la playa\n- Aire acondicionado, Smart TV, Wi-Fi\n- Patio cubierto con parrilla, cochera en complejo\n\n**Departamentos LG** (2 ambientes): $80.000 por noche\n- A 2 cuadras del mar\n- Aire acondicionado, TV LED, Wi-Fi\n- Solarium con parrilla, cochera en complejo\n- Estadía mínima 5 noches\n\n¿Qué fechas específicas de marzo te interesan y cuántas noches pensaban quedarse? Así verifico disponibilidad en el que más te guste.	{"intent": "consulta_precio", "entities": {"mes": "marzo", "num_personas": 4}, "confidence": 0.85}	\N	2026-03-07 00:02:53.008
cmmfk8fge000dibb0a0jwvxma	cmmfk8ffv000bibb0mu2ce1i1	text	entrante	huesped	hola somos 2 personas, que opciones tienen para marzo?	\N	sim_in_1772841799691	2026-03-07 00:03:19.743
cmmfk8k0h000fibb09xv2xgi8	cmmfk8ffv000bibb0mu2ce1i1	text	saliente	bot	¡Hola! Gracias por contactarnos 😊\n\nPara 2 personas en marzo tenemos todas nuestras opciones disponibles, ya que marzo es temporada baja. Las tarifas son super accesibles:\n\n**Opciones disponibles:**\n- **Pewmafe** (2 ambientes): $70.000 por noche\n- **Luminar Monoambiente**: $65.000 por noche  \n- **Luminar 2 Ambientes**: $70.000 por noche\n- **Departamentos LG** (2 ambientes): $80.000 por noche\n\nTodos incluyen ropa de cama, toallas, Wi-Fi, aire acondicionado y están a 2-3 cuadras de la playa.\n\nPara confirmar disponibilidad exacta, ¿me decís qué fechas tenés pensadas? ¿Fecha de entrada y salida, o cuántas noches querés quedarte?	{"intent": "consulta_disponibilidad", "entities": {"mes": "marzo", "num_personas": 2}, "confidence": 0.95}	\N	2026-03-07 00:03:25.65
cmmfk96ec000hibb07ssoptme	cmmfk7oof0004ibb0pb3dwvrj	text	entrante	huesped	del 10 al 15 de marzo	\N	sim_in_1772841834638	2026-03-07 00:03:54.66
cmmfk9btq000jibb07a9y8kv8	cmmfk7oof0004ibb0pb3dwvrj	text	saliente	bot	Perfecto, te confirmo disponibilidad del 10 al 15 de marzo (5 noches) para 4 personas:\n\n✅ **Pewmafe**: Disponible - $350.000 total (5 noches x $70.000)\n- 2 cuadras de la playa, patio con parrilla individual, cochera propia\n\n✅ **Luminar 2 Ambientes**: Disponible - $350.000 total (5 noches x $70.000)\n- 2 cuadras de la playa, patio cubierto con parrilla, cochera en complejo\n\n✅ **Departamentos LG**: Disponible - $400.000 total (5 noches x $80.000)\n- 2 cuadras del mar, solarium amplio con parrilla, cochera en complejo\n\nLos tres están equipados con todo lo necesario: ropa de cama, toallas, cocina completa, aire acondicionado y Wi-Fi. \n\n¿Cuál te interesa más? Te puedo dar más detalles del que prefieras o si querés reservar necesito que confirmes cuál elegís.	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-15", "num_personas": 4, "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-07 00:04:01.694
cmmfk9vug000oibb0iezqfxvc	cmmfk9vu2000mibb0hk2migsi	text	entrante	huesped	me interesa pewmafe, pasame fotos	\N	sim_in_1772841867607	2026-03-07 00:04:27.64
cmmfk9wi6000qibb0uaidjay0	cmmfk9vu2000mibb0hk2migsi	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-07 00:04:28.494
cmmfkf8rd0004ibxgx9mqfzew	cmmfkf8qk0002ibxgub2m4h72	text	entrante	huesped	hola busco alojamiento en las grutas	\N	sim_in_1772842117575	2026-03-07 00:08:37.657
cmmfkfcnn0006ibxg5mws3avh	cmmfkf8qk0002ibxgub2m4h72	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos 😊\n\nTenemos varios departamentos disponibles en Las Grutas, todos muy cerca de la playa. Para ayudarte mejor, necesito que me cuentes:\n\n• ¿Para cuantas personas es el alojamiento?\n• ¿Que fechas tenias pensadas para venir?\n• ¿Cuantas noches te vas a quedar?\n\nAsi te puedo mostrar los departamentos que mejor se ajusten a lo que necesitas y darte los precios exactos.	{"intent": "consulta_alojamiento", "entities": {"zona": "las grutas"}, "confidence": 0.85}	\N	2026-03-07 00:08:42.707
cmmfkfmcr0008ibxga7y6xssi	cmmfkf8qk0002ibxgub2m4h72	text	entrante	huesped	somos 4 personas	\N	sim_in_1772842135241	2026-03-07 00:08:55.275
cmmfkfpbv000aibxgaunzo33i	cmmfkf8qk0002ibxgub2m4h72	text	saliente	bot	Perfecto, para 4 personas tengo varias opciones ideales.\n\nAhora necesito saber:\n• ¿Que fechas tenias pensadas para venir?\n• ¿Cuantas noches se van a quedar?\n\nCon eso te paso la disponibilidad y los precios exactos de los departamentos que les van a servir.	{"intent": "consulta_alojamiento", "entities": {"num_personas": 4}, "confidence": 0.85}	\N	2026-03-07 00:08:59.131
cmmfkgcwk000eibxgo473ndbe	cmmfkf8qk0002ibxgub2m4h72	text	saliente	bot	Excelente, tengo muy buenas noticias. Para 4 personas del 10 al 15 de abril (5 noches) tengo estos departamentos disponibles:\n\n**Departamentos Pewmafe** - $350.000 total ($70.000 por noche)\nA 2 cuadras de la playa, 2 ambientes con dormitorio matrimonial, aire acondicionado, Smart TV, Wi-Fi, patio y parrilla individual, cochera.\n\n**Complejo Luminar 2 Ambientes** - $350.000 total ($70.000 por noche)\nA 2 cuadras del mar, dormitorio + living con sofá cama, aire acondicionado, Smart TV, patio cubierto con parrilla, cochera.\n\n**Departamentos LG** - $400.000 total ($80.000 por noche)\nA 2 cuadras del mar, 2 ambientes muy luminoso con solarium, cama queen, aire acondicionado, TV LED, parrilla, cochera.\n\nTodos incluyen ropa de cama, toallas y Wi-Fi. ¿Cual te interesa o queres que te cuente más detalles de alguno?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-04-15", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.95}	\N	2026-03-07 00:09:29.684
cmmfkgwmn000gibxgk6ofly3t	cmmfkf8qk0002ibxgub2m4h72	text	entrante	huesped	me interesa pewmafe	\N	sim_in_1772842195223	2026-03-07 00:09:55.247
cmmfkh17f000iibxgvcro9rym	cmmfkf8qk0002ibxgub2m4h72	text	saliente	bot	¡Excelente elección! Pewmafe es un departamento muy completo y está super cerca de la playa.\n\nTe confirmo: para 4 personas del 10 al 15 de abril (5 noches) el total es **$350.000**.\n\nEstá ubicado en Punta Perdices 370, a solo 2 cuadras de la bajada La Rinconada. Tiene todo lo necesario: dormitorio con cama matrimonial, baño completo con bidet, cocina equipada, aire acondicionado, Smart TV, Wi-Fi, patio individual con parrilla y cochera.\n\n¿Querés que te reserve estas fechas? Para confirmar necesito una seña del 30% ($105.000) y el saldo restante lo pagas al check-in (14hs).	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-15", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.85}	\N	2026-03-07 00:10:01.179
cmmfkhha1000kibxgys79edln	cmmfkf8qk0002ibxgub2m4h72	text	entrante	huesped	si primero mostrame fotos	\N	sim_in_1772842221987	2026-03-07 00:10:22.01
cmmfkhhxf000mibxgji3anpm8	cmmfkf8qk0002ibxgub2m4h72	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-15", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-07 00:10:22.852
cmmfkp1g1000oibxgaysjr1o9	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola	\N	sim_in_1772842574698	2026-03-07 00:16:14.737
cmmfkq2p3000qibxgu8pf5kux	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	te consulto	\N	sim_in_1772842622992	2026-03-07 00:17:03.015
cmmfkrurm000sibxgop9hh9rr	cmm47wusm0002ibr8iv2c5rgs	system	saliente	sistema	Conversacion devuelta al bot	\N	\N	2026-03-07 00:18:26.051
cmmfkrxsi000uibxg8oaf6tjp	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola	\N	sim_in_1772842709961	2026-03-07 00:18:29.971
cmmfks0d0000wibxgf0q2s16q	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	¡Hola de nuevo! ¿En qué puedo ayudarte? ¿Querés seguir con la consulta para 3 personas el 15 de marzo, o preferís consultar por otras fechas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 00:18:33.3
cmmfksief000yibxgi5104o61	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	hola	\N	sim_in_1772842736664	2026-03-07 00:18:56.679
cmmfksl6i0010ibxgepsbvpb3	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte? Estoy acá para brindarte información sobre nuestros departamentos en Las Grutas, disponibilidad, tarifas o cualquier consulta que tengas.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 00:19:00.282
cmmfksxje0012ibxgpcm6ze4y	cmm47wusm0002ibr8iv2c5rgs	text	saliente	agente	me podes pasar informacion para alquiler en las grutas ?	\N	\N	2026-03-07 00:19:16.299
cmmfkt8nj0014ibxgs34cf91x	cmm47wusm0002ibr8iv2c5rgs	system	saliente	sistema	Conversacion devuelta al bot	\N	\N	2026-03-07 00:19:30.704
cmmfktijr0016ibxgem3p88nj	cmm47wusm0002ibr8iv2c5rgs	text	entrante	huesped	me podes pasar info de departamentos en las grutas ?	\N	sim_in_1772842783510	2026-03-07 00:19:43.528
cmmfktnc60018ibxgr1bskd08	cmm47wusm0002ibr8iv2c5rgs	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-07 00:19:49.735
cmmfktnfe001aibxgjom4m17d	cmm47wusm0002ibr8iv2c5rgs	text	saliente	bot	Claro, te cuento sobre **Pewmafe**, nuestro departamento de 2 ambientes:\n\n**Ubicación:** Punta Perdices 370, a solo 2 cuadras de la playa (bajada La Rinconada)\n\n**Capacidad:** hasta 4 personas\n**Ambientes:** 1 dormitorio con cama matrimonial, living-comedor, cocina equipada, baño completo con bidet\n\n**Comodidades:** aire acondicionado, Smart TV, Wi-Fi, patio individual con parrilla, cochera propia\n\nIncluye ropa de cama y toallas. Check-in 14hs, check-out 10hs.\n\n**Tarifas por noche:** Temporada baja (marzo) $70.000 - Temp. media $90.000 - Temp. alta (verano) $120.000\n\n¿Te interesa para las fechas que consultaste (15 de marzo, 3 personas)? Solo necesito saber cuantas noches te quedarias.	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-15", "num_personas": 3, "fecha_entrada": "2026-03-15"}, "confidence": 0.95}	\N	2026-03-07 00:19:49.85
cmmfl7l23001eibxgcsyol5fr	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	hola	\N	sim_in_1772843439933	2026-03-07 00:30:39.963
cmmfl7o5u001gibxgkf16u1ib	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos 😊\n\n¿En qué puedo ayudarte hoy? ¿Te interesa conocer nuestros departamentos, consultar disponibilidad para tus próximas vacaciones o necesitas información sobre la zona?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 00:30:43.986
cmmfl82ax001iibxg76wv3esw	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	te consulto para alquilar departamento somos 4 personas	\N	sim_in_1772843462287	2026-03-07 00:31:02.313
cmmfl85l3001kibxgxnjxx6xk	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	¡Perfecto! Tenemos varias opciones ideales para 4 personas.\n\nPara ayudarte mejor, ¿podrías decirme qué fechas tenías pensadas? ¿Cuándo llegarías y cuándo te irías? Así puedo mostrarte los departamentos disponibles y pasarte las tarifas exactas.	{"intent": "consulta_alojamiento", "entities": {"num_personas": 4}, "confidence": 0.9}	\N	2026-03-07 00:31:06.567
cmmfm6ggk0001ib0cxgy4shyc	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	hola	\N	sim_in_1772845066930	2026-03-07 00:57:46.959
cmmfm6koy0003ib0cy8rmwaba	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	Hola de nuevo 😊\n\nTe estaba comentando que tenemos departamentos ideales para 4 personas. Para mostrarte disponibilidad y precios, necesito saber: ¿qué fechas tenías pensadas para tu estadía? ¿Cuándo llegarías y cuándo te irías?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 00:57:52.45
cmmfm76x10005ib0crr91ve3a	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	llego el 5 de abril y me voy el 10 de abril, somos 4 personas	\N	sim_in_1772845101233	2026-03-07 00:58:21.253
cmmh218jo005yibakat1ve98e	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	estoy buscando alojamiento para 10 personas	\N	sim_in_1772932163421	2026-03-08 01:09:23.46
cmmfm7byr0007ib0c6cgv6q7k	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	¡Excelente! Para el 5 al 10 de abril de 2025 (5 noches), tengo disponibilidad en estos departamentos para 4 personas:\n\n**Pewmafé** (Punta Perdices 370) - 2 cuadras de la playa\n• 2 ambientes, 1 dormitorio, parrilla y patio propio\n• **$350.000 ARS** las 5 noches\n\n**Luminar 2Amb** (Golfo San Jorge 560) - 2 cuadras de la playa  \n• 2 ambientes, 1 dormitorio, parrilla y solarium\n• **$350.000 ARS** las 5 noches\n\n**LG** (Golfo San Jorge 560) - 2 cuadras del mar\n• 2 ambientes, 1 dormitorio, 50m², parrilla\n• **$400.000 ARS** las 5 noches\n\nTodos tienen aire acondicionado, Wi-Fi, cocina equipada, ropa de cama y toallas incluidas. ¿Te gustaría ver las fotos de alguno en particular?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-04-10", "num_personas": 4, "fecha_entrada": "2026-04-05"}, "confidence": 0.95}	\N	2026-03-07 00:58:27.795
cmmfm7wka0009ib0c5rsie78k	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	quiero fotos de pewmafe	\N	sim_in_1772845134473	2026-03-07 00:58:54.49
cmmfm7xe5000bib0c63o3zy3s	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-10", "num_personas": 4, "fecha_entrada": "2026-04-05"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-07 00:58:55.566
cmmfm88z4000dib0cihe053li	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	que servicios tiene el departamento ?	\N	sim_in_1772845150558	2026-03-07 00:59:10.576
cmmfm8d9n000fib0ct2yfkayp	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	El departamento **Pewmafe** incluye:\n\n• **Aire acondicionado** y calefacción\n• **Smart TV** y **Wi-Fi**\n• **Cocina totalmente equipada** (heladera, horno, microondas, utensilios)\n• **Parrilla individual** en el patio propio\n• **Ropa de cama y toallas** incluidas\n• **Estacionamiento** (cochera propia)\n• **Patio individual** para disfrutar al aire libre\n\nEstá a solo 2 cuadras de la playa (bajada La Rinconada). ¿Te gustaría hacer la reserva o tenés alguna otra consulta?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-10", "num_personas": 4, "fecha_entrada": "2026-04-05"}, "confidence": 0.95}	\N	2026-03-07 00:59:16.139
cmmfm8zm9000hib0ct0x3lmga	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	a cuantas cuadras esta del mar	\N	sim_in_1772845185043	2026-03-07 00:59:45.106
cmmfm92py000jib0ch1ksj7x3	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	El departamento **Pewmafe** está a **2 cuadras de la playa**, con acceso directo por la bajada La Rinconada.\n\nEs una ubicación ideal: llegás caminando en pocos minutos y tenés la comodidad de volver rápido al depto cuando querés. ¿Te interesa reservarlo?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-10", "num_personas": 4, "fecha_entrada": "2026-04-05"}, "confidence": 0.95}	\N	2026-03-07 00:59:49.127
cmmfm9g67000lib0c9cnbbgjy	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	que clima hay en abril en las grutas	\N	sim_in_1772845206541	2026-03-07 01:00:06.56
cmmfm9mv1000nib0cuo9h4zll	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	En **abril en Las Grutas** ya estamos en otoño, con clima agradable y tranquilo:\n\n• **Temperaturas**: entre 12°C y 20°C aproximadamente\n• **Días más frescos** que el verano, ideales para caminar por la playa y recorrer sin el calor intenso\n• **Menos turistas**: podés disfrutar de las playas y grutas con mucha tranquilidad\n• Recomiendo traer **abrigo ligero** para las mañanas y noches\n\nEs una época linda para conocer la zona sin las multitudes del verano. ¿Te copa reservar del 5 al 10 de abril en Pewmafe?	{"intent": "otro", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-10", "num_personas": 4, "fecha_entrada": "2026-04-05"}, "confidence": 0.5}	\N	2026-03-07 01:00:15.229
cmmfmb6tj000pib0ct1utr55o	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-07 01:01:27.751
cmmfmby9x000rib0cv5u1kb62	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	si queres reservarlo ?	\N	sim_in_1772845323311	2026-03-07 01:02:03.333
cmmfmc4nt000tib0cz1hv8ug7	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-07 01:02:11.609
cmmfmcbbk000vib0cn0sxwz21	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-07 01:02:20.24
cmmfmchij000xib0c75cz7ljk	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-07 01:02:28.268
cmmfmhty9000zib0c1pgt1w24	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	hola	\N	sim_in_1772845597637	2026-03-07 01:06:37.665
cmmfmimh00011ib0clrbpkccs	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Conversacion devuelta al bot	\N	\N	2026-03-07 01:07:14.628
cmmfmipp00013ib0cypie2opo	cmmfl7l1k001cibxgkqpexm54	text	entrante	huesped	hola	\N	sim_in_1772845638782	2026-03-07 01:07:18.805
cmmfmiswv0015ib0cubxrieqe	cmmfl7l1k001cibxgkqpexm54	text	saliente	bot	¡Perfecto! Para confirmar tu reserva en **Pewmafe** del **5 al 10 de abril** (5 noches), necesito saber:\n\n**¿Cuántas personas van a alojarse?** (Pewmafe tiene capacidad hasta 4 personas)\n\nUna vez que me confirmes esto, te paso el precio total y los datos para la seña del 30%.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 01:07:22.975
cmmfmj09c0017ib0c4fmbgww3	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-07 01:07:32.497
cmmfmj4kz0019ib0cwscjzn67	cmmfl7l1k001cibxgkqpexm54	text	saliente	agente	hola	\N	\N	2026-03-07 01:07:38.099
cmmfmjpi2001bib0ct4f9pt9q	cmmfl7l1k001cibxgkqpexm54	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-07 01:08:05.21
cmmfmjs87001fib0c1tonh0an	cmmfmjs7j001dib0ccns85ysj	text	entrante	huesped	hola	\N	sim_in_1772845688703	2026-03-07 01:08:08.743
cmmfmjuqz001hib0ceknze78f	cmmfmjs7j001dib0ccns85ysj	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos 😊\n\n¿En qué puedo ayudarte hoy? Podes consultarme sobre nuestros departamentos, disponibilidad, precios o cualquier información sobre Las Grutas que necesites.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 01:08:12.011
cmmfmk7vm001jib0ckjaqj96j	cmmfmjs7j001dib0ccns85ysj	text	entrante	huesped	quiero consultar para 4 personas alojamiento	\N	sim_in_1772845709006	2026-03-07 01:08:29.026
cmmfmkbqf001lib0cz1vydhc7	cmmfmjs7j001dib0ccns85ysj	text	saliente	bot	Perfecto, para 4 personas tenemos varias opciones disponibles. \n\nPara ayudarte mejor, ¿me podrías decir para qué fechas estarías buscando? ¿Cuándo pensás venir y cuántas noches te quedarías?\n\nTenemos departamentos como Pewmafe, Luminar 2Amb y LG, todos con capacidad para 4 personas, ubicados a pocas cuadras de la playa.	{"intent": "consulta_alojamiento", "entities": {"num_personas": 4}, "confidence": 0.85}	\N	2026-03-07 01:08:34.023
cmmfmkkd7001nib0cmyzzh2gi	cmmfmjs7j001dib0ccns85ysj	text	entrante	huesped	del 10 de abril al 15 de abril	\N	sim_in_1772845725199	2026-03-07 01:08:45.211
cmmfmkpp1001pib0c52cvmgav	cmmfmjs7j001dib0ccns85ysj	text	saliente	bot	Genial, del 10 al 15 de abril son 5 noches. Para esas fechas (temporada baja) tengo disponibilidad en 3 departamentos para 4 personas:\n\n**Pewmafe** - 2 ambientes, a 2 cuadras de la playa\n• $350.000 las 5 noches ($70.000 por noche)\n• Aire acondicionado, Smart TV, Wi-Fi, parrilla y patio individual\n\n**Luminar 2Amb** - 2 ambientes, a 2 cuadras de la playa  \n• $350.000 las 5 noches ($70.000 por noche)\n• Aire acondicionado, Smart TV, Wi-Fi, patio con parrilla, cochera cubierta\n\n**LG** - 2 ambientes, a 2 cuadras del mar\n• $400.000 las 5 noches ($80.000 por noche)\n• Aire acondicionado, TV LED, Wi-Fi, solarium amplio, parrilla, cochera cubierta\n\nTodos incluyen ropa de cama, toallas y cocina completa. ¿Te gustaría que te envíe fotos de alguno en particular?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-04-15", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.95}	\N	2026-03-07 01:08:52.117
cmmfmm0nz001rib0ck2m8mkm3	cmmfmjs7j001dib0ccns85ysj	text	entrante	huesped	pewmafe, me envias fotos ?	\N	sim_in_1772845792982	2026-03-07 01:09:52.992
cmmfmm17a001tib0cqruig7hy	cmmfmjs7j001dib0ccns85ysj	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-15", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-07 01:09:53.686
cmmfmm8p0001vib0ckttsoeg4	cmmfmjs7j001dib0ccns85ysj	text	entrante	huesped	como hago para reservarlo ?	\N	sim_in_1772845803379	2026-03-07 01:10:03.397
cmmfmme6i001xib0cbytdvzg9	cmmfmjs7j001dib0ccns85ysj	text	saliente	bot	Para reservar Pewmafe del 10 al 15 de abril, el procedimiento es así:\n\n1. **Señá del 30%**: Para confirmar la reserva tenés que hacer una transferencia bancaria o pago por MercadoPago de $105.000 (30% de $350.000)\n\n2. **Saldo restante**: Los $245.000 restantes se abonan al momento del check-in (14:00 hs el 10 de abril)\n\nSi querés seguir adelante con la reserva, comunicate directamente por WhatsApp al **+54 2920 561033** o por email a **lasgrutasdepartamentos@gmail.com** y te pasamos los datos para hacer la transferencia.\n\n¿Necesitás alguna otra información sobre el departamento o Las Grutas?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-15", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.95}	\N	2026-03-07 01:10:10.507
cmmfpd4gs0002ibso9tx7kt4v	cmmfmjs7j001dib0ccns85ysj	text	entrante	huesped	hola	\N	sim_in_1772850416813	2026-03-07 02:26:56.859
cmmfpd7ao0004ibsokezjbm0c	cmmfmjs7j001dib0ccns85ysj	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte? ¿Querés continuar con la reserva de Pewmafe o tenés alguna otra consulta sobre nuestros departamentos en Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 02:27:00.529
cmmfpdk2g0006ibsoiu22jcv3	cmmfmjs7j001dib0ccns85ysj	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-07 02:27:17.08
cmmfpdom3000aibsolu6qlv3s	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	hola	\N	sim_in_1772850442922	2026-03-07 02:27:22.972
cmmfpdr21000cibso237sz523	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos 😊\n\n¿En qué puedo ayudarte hoy? Puedo informarte sobre nuestros departamentos, tarifas, disponibilidad o lo que necesites saber para tu estadía en Las Grutas.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 02:27:26.138
cmmfpe7yg000eibsoijodotaq	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	consulta de alojamiento para ingresar en abril somos 4 personas	\N	sim_in_1772850468019	2026-03-07 02:27:48.041
cmmfpecsn000gibso8ug1zb42	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	¡Perfecto! Para poder ayudarte mejor, necesito saber las fechas exactas de tu estadía:\n\n- ¿Qué días de abril pensás ingresar y cuántas noches te quedarías?\n\nAbril está en temporada baja, así que tenemos muy buenas tarifas. Tenemos 3 opciones de departamentos ideales para 4 personas: Pewmafe, Luminar 2Amb y LG, todos con 1 dormitorio, aire acondicionado, Wi-Fi y cocina completa.	{"intent": "consulta_alojamiento", "entities": {"mes_entrada": "abril", "num_personas": 4}, "confidence": 0.95}	\N	2026-03-07 02:27:54.311
cmmfpeqjm000iibsoq3vtigtr	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	ok me pasas fotos	\N	sim_in_1772850492110	2026-03-07 02:28:12.13
cmmfpjrxv000kibsorv63e7f4	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	hola	\N	sim_in_1772850727193	2026-03-07 02:32:07.219
cmmfpjvv5000mibso0u3y5owu	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	¡Ahí te envío las fotos de los departamentos disponibles para 4 personas!\n\nPara poder pasarte la disponibilidad exacta y el precio total de tu estadía, necesito que me confirmes:\n\n- ¿Qué fechas de abril tenés pensadas para ingresar?\n- ¿Cuántas noches te quedarías?\n\nAsí te puedo informar con precisión qué departamentos tenemos disponibles para esas fechas específicas 😊	{"intent": "consulta_alojamiento", "entities": {"mes": "abril", "solicitud": "fotos", "num_personas": 4}, "confidence": 0.95}	\N	2026-03-07 02:32:12.305
cmmfpk48t000oibsohd01vr0m	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	info de alojamiento para abril 4 personas	\N	sim_in_1772850743146	2026-03-07 02:32:23.165
cmmfpk96f000qibsod4vcwtan	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	Perfecto, te cuento sobre las opciones para 4 personas en abril (temporada baja):\n\n**PEWMAFE** - $70.000/noche\nA 2 cuadras de la playa. Tiene 1 dormitorio, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio individual con parrilla y cochera.\n\n**LUMINAR 2AMB** - $70.000/noche  \nA 2 cuadras de la playa. Tiene 1 dormitorio, aire acondicionado, Smart TV, Wi-Fi, cocina completa, patio cubierto con parrilla y estacionamiento cubierto.\n\n**LG** - $80.000/noche\nA 2 cuadras del mar. Tiene 1 dormitorio, aire acondicionado, TV LED, Wi-Fi, cocina con heladera y microondas, solarium amplio, parrilla y estacionamiento cubierto. Estadía mínima 5 noches.\n\nPara pasarte el precio total y confirmar disponibilidad, ¿qué fechas de abril tenés pensadas y cuántas noches serían?	{"intent": "consulta_alojamiento", "entities": {"mes": "abril", "num_personas": 4}, "confidence": 0.85}	\N	2026-03-07 02:32:29.559
cmmfpkehq000sibso8as6v7w4	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	me pasas fotos	\N	sim_in_1772850756429	2026-03-07 02:32:36.446
cmmfpkhfz000uibsoq5vj4a48	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	Las fotos ya te las envié anteriormente 😊\n\nPara avanzar con tu consulta, necesito que me confirmes:\n- ¿Qué fechas de abril tenés pensadas para ingresar?\n- ¿Cuántas noches te quedarías?\n\nCon esa información te paso la disponibilidad exacta y el costo total de la estadía para que puedas decidir qué departamento te conviene más.	{"intent": "consulta_alojamiento", "entities": {"mes": "abril", "num_personas": 4}, "confidence": 0.95}	\N	2026-03-07 02:32:40.27
cmmfpkxap000wibsokrdyid0j	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	son 4 noches delsde el 10 de abril, no recibi las fotos	\N	sim_in_1772850780793	2026-03-07 02:33:00.817
cmmh408ir003ribhsvki49x7b	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772935475967	2026-03-08 02:04:36.004
cmmfpl2g1000yibsopeydq685	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	Perfecto, ya tengo tus datos:\n- **4 personas**\n- **10 al 14 de abril** (4 noches)\n- **Temporada baja**\n\nTe paso las opciones disponibles con el costo total:\n\n**PEWMAFE** - $280.000 (4 noches)\nA 2 cuadras de la playa, patio con parrilla individual y cochera.\n\n**LUMINAR 2AMB** - $280.000 (4 noches)\nA 2 cuadras de la playa, patio cubierto con parrilla y estacionamiento cubierto.\n\n**LG** - NO disponible (requiere mínimo 5 noches)\n\nLas fotos se envían automáticamente por el sistema. Si no te llegaron, puede haber un problema técnico. ¿Cuál de los dos departamentos te interesa más? Así te puedo dar más detalles y avanzar con la reserva si querés.	{"intent": "consulta_alojamiento", "entities": {"num_noches": 4, "fecha_salida": "2026-04-14", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.85}	\N	2026-03-07 02:33:07.489
cmmfpldtf0010ibso0i3o21ps	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	pewmafe	\N	sim_in_1772850802211	2026-03-07 02:33:22.227
cmmfplkpo0012ibso2suox2nh	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	Excelente elección, **Pewmafe** está disponible para tus fechas:\n\n📍 **Punta Perdices 370** - a solo 2 cuadras de la playa (bajada La Rinconada)\n\n✅ **10 al 14 de abril** - 4 noches\n💰 **Total: $280.000**\n\nEl departamento tiene todo lo necesario: dormitorio para 4 personas, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio individual con parrilla y cochera. Ropa de cama incluida (toallas no).\n\n**Check-in:** 14 hs | **Check-out:** 10 hs\n\n¿Querés confirmar la reserva? Para eso necesito una seña del 30% ($84.000). Podés abonarla por:\n- Transferencia bancaria (te paso los datos)\n- Tarjeta de crédito vía MercadoPago (recargo 8%)\n\nEl saldo restante ($196.000) se abona por transferencia al ingresar. ¿Cómo preferís pagar la seña?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "num_noches": 4, "fecha_salida": "2026-04-14", "num_personas": 4, "fecha_entrada": "2026-04-10"}, "confidence": 0.85}	\N	2026-03-07 02:33:31.164
cmmgculza0014ibsox84pmbsh	cmmfpdolb0008ibsoz6y72cw7	text	entrante	huesped	hola	\N	sim_in_1772889863804	2026-03-07 13:24:23.872
cmmgcuqt40016ibsozuzyjo9f	cmmfpdolb0008ibsoz6y72cw7	text	saliente	bot	¡Hola! ¿Cómo estás? 😊\n\nEstábamos justo en el proceso de confirmar tu reserva en **Pewmafe** para el **10 al 14 de abril** (4 noches, 4 personas, $280.000 total).\n\n¿Querés seguir adelante con la reserva? Solo necesito saber cómo preferís pagar la seña del 30% ($84.000):\n- Transferencia bancaria \n- Tarjeta de crédito vía MercadoPago (con recargo del 8%)\n\n¿Con cuál te resulta más cómodo?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-07 13:24:30.136
cmmgcuy9d0018ibsom51qiha8	cmmfpdolb0008ibsoz6y72cw7	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-07 13:24:39.793
cmmh40bh3003tibhsh1dvuyhy	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte hoy? 😊\n\nEstoy acá para responder tus consultas sobre nuestros departamentos en Las Grutas, disponibilidad, precios o lo que necesites saber.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 02:04:39.832
cmmh40pqq003vibhsd51053q5	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	consulta por alojamiento somos 10 personas es para la noche de mañana solamente	\N	sim_in_1772935498250	2026-03-08 02:04:58.322
cmmh40v6h003xibhsnn2qibxo	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Hola, gracias por tu consulta. Lamentablemente tenemos **dos inconvenientes** para tu pedido:\n\n**1. Capacidad:** Nuestros departamentos tienen capacidad máxima de **4 personas por unidad**. Para 10 personas necesitarías combinar varios departamentos, pero no contamos con suficiente capacidad disponible para alojar a 10 personas juntas.\n\n**2. Estadía mínima:** Todos nuestros departamentos requieren una estadía mínima (entre 2 y 5 noches según el tipo), por lo que no podemos ofrecer alojamiento por solo 1 noche.\n\nTe recomiendo que nos contactes directamente al **+54 2920 561033** (WhatsApp) para que podamos analizar tu caso particular y ver si hay alguna alternativa posible.\n\n¿Hay algo más en lo que pueda ayudarte?	{"intent": "consulta_alojamiento", "entities": {"fecha_salida": "2026-01-10", "num_personas": "10", "fecha_entrada": "2026-01-09"}, "confidence": 0.9}	\N	2026-03-08 02:05:05.369
cmmh21d1u0060ibakjfvqtnxv	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Entiendo que están buscando alojamiento para 10 personas. \n\nNuestra capacidad máxima por departamento es de 4 personas, pero podemos ofrecerte una combinación de departamentos para alojar a tu grupo. Por ejemplo, podrías reservar 3 departamentos (uno para 4 personas y dos para 3 personas cada uno), o la combinación que mejor se adapte a tu grupo.\n\nPara poder ayudarte mejor, necesito que me cuentes: **¿Qué fechas tenés pensadas para venir a Las Grutas?** (fecha de entrada y salida, o cuántas noches van a quedarse)	{"intent": "consulta_alojamiento", "entities": {"num_personas": "10"}, "confidence": 0.9}	\N	2026-03-08 01:09:29.298
cmmh21wim0062ibake97vvcff	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	el 10 de marzo	\N	sim_in_1772932194505	2026-03-08 01:09:54.526
cmmh21z700064ibakb97e68e8	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Perfecto, el 10 de marzo sería la fecha de entrada. \n\n**¿Cuántas noches se van a quedar?** O si preferís, decime la fecha de salida y yo calculo las noches.	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "10", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-08 01:09:57.996
cmmh223ew0066ibaklw02iln4	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	5 noches	\N	sim_in_1772932203444	2026-03-08 01:10:03.464
cmmh229jd0068ibakcub99d0n	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Perfecto, entonces sería del **10 al 15 de marzo de 2026**, 5 noches para 10 personas.\n\nPara ese período, tengo disponibilidad en los siguientes departamentos:\n\n**Luminar Mono** (capacidad 3 personas)\n- $325.000 ARS total por las 5 noches\n\n**Luminar 2Amb** (capacidad 4 personas)  \n- $350.000 ARS total por las 5 noches\n\n**LG** (capacidad 4 personas)\n- $400.000 ARS total por las 5 noches\n\nPara alojar a las 10 personas, podrías combinar, por ejemplo:\n- 2 deptos LG (8 personas) + 1 Luminar Mono (2 personas) = $1.125.000 ARS\n- 2 deptos Luminar 2Amb (8 personas) + 1 Luminar Mono (2 personas) = $1.025.000 ARS\n\nTodos están a 2-3 cuadras de la playa y cuentan con aire acondicionado, Wi-Fi, cocina equipada y estacionamiento.\n\n**¿Qué combinación te interesa más?**	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-15", "num_personas": "10", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-08 01:10:11.398
cmmi2kkx300n8ibqcsnrzk44n	cmmi2k7qz00n0ibqc8r1dvc3f	text	saliente	bot	Perfecto, para ayudarte mejor necesito saber:\n\n¿Cuántas noches te gustaría quedarte?\n\nCon esa info puedo mostrarte las opciones disponibles cercanas a la playa para 2 personas desde mañana (09/03/2026).	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.85}	\N	2026-03-08 18:12:12.135
cmmi2kqf000naibqci8hxfekd	cmmi2k7qz00n0ibqc8r1dvc3f	text	entrante	huesped	5 noches	\N	sim_in_1772993539247	2026-03-08 18:12:19.26
cmmju6qgx0005ibc43m1t8680	cmmi2md3s00nkibqchwucs245	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-09 23:53:01.569
cmmi2kvyj00ncibqc179h3fl0	cmmi2k7qz00n0ibqc8r1dvc3f	text	saliente	bot	Perfecto! Para 2 personas del 09/03 al 14/03 (5 noches) tengo estas opciones disponibles cerca de la playa:\n\n**Luminar Mono** - $325.000 total\n- Monoambiente de 35-40m² a 2-3 cuadras de la playa\n- Aire acondicionado, TV con cable, Wi-Fi, cocina completa\n- Estacionamiento cubierto en el complejo\n\n**Luminar 2Amb** - $350.000 total\n- Departamento de 45-50m² a 2 cuadras de la playa\n- 1 dormitorio separado, aire acondicionado, Smart TV\n- Patio cubierto con parrilla\n- Estacionamiento cubierto en el complejo\n\n**LG** - $400.000 total\n- Departamento de 50m² a 2 cuadras del mar\n- 1 dormitorio, aire acondicionado, TV LED\n- Solarium amplio con parrilla\n- Estacionamiento cubierto en el complejo\n\nTodos incluyen ropa de cama (toallas no incluidas). ¿Cuál te interesa más?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-14", "num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-08 18:12:26.442
cmmi2md4800nmibqchy6cgma1	cmmi2md3s00nkibqchwucs245	text	entrante	huesped	hola	\N	sim_in_1772993615304	2026-03-08 18:13:35.336
cmmi2yqe000oiibqchf60iugp	cmmi2ylhz00oeibqcdpy0g9gp	text	saliente	bot	¡Hola! ¿Cómo estás? Gracias por comunicarte con Las Grutas Departamentos.\n\nTe comento que no contamos con un departamento llamado "Premium Suite" en nuestro alojamiento. Tenemos 4 opciones disponibles: **Pewmafe** (dpto 2 ambientes), **Luminar Mono** (monoambiente), **Luminar 2Amb** (dpto 2 ambientes) y **LG** (dpto 2 ambientes).\n\n¿Para cuántas personas necesitás el alojamiento y para qué fechas? Así puedo mostrarte las opciones que mejor se adapten a tus necesidades.	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Premium Suite"}, "confidence": 0.85}	\N	2026-03-08 18:23:12.385
cmmi2ywcf00onibqcbytm1j3r	cmmi2ywbt00olibqc93rlznim	text	entrante	huesped	Hola quiero 3 noches en LG	\N	sim_in_1772994200077	2026-03-08 18:23:20.128
cmmju6w5t000bibc424bpkwcm	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Estás buscando alojamiento para visitar Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-09 23:53:08.945
cmmju74pb000dibc41qhyd1of	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	si	\N	sim_in_1773100399982	2026-03-09 23:53:20.016
cmmju76rl000fibc4nz42y54g	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	¡Perfecto! Para mostrarte las mejores opciones disponibles, necesito algunos datos:\n\n¿Para cuántas personas estás buscando alojamiento?	{"intent": "saludo", "entities": {}, "confidence": 0.8}	\N	2026-03-09 23:53:22.689
cmmju7djb000hibc4twg569p5	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	4 personas para hoy	\N	sim_in_1773100411438	2026-03-09 23:53:31.463
cmmhudshr008nibqc7ii4ecas	cmmhudshi008libqcycqtm1or	text	entrante	huesped	Hola, buenos dias!	\N	sim_in_1772979778408	2026-03-08 14:22:58.431
cmmhue5k5008wibqctj4c8str	cmmhue3ce008sibqcx3ed614o	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? Podés consultarme sobre disponibilidad, precios, nuestros departamentos o cualquier otra información que necesites para tu estadía en Las Grutas.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:23:15.366
cmmhuee59008yibqcyphohwv8	cmmhue3ce008sibqcx3ed614o	text	entrante	huesped	Quiero alojarme 1 noche para manana 9 de marzo, somos 2 personas	\N	sim_in_1772979806483	2026-03-08 14:23:26.493
cmmhuhgq800apibqcliieybf3	cmmhuhedv00alibqc69w86wp8	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? Puedo informarte sobre disponibilidad, precios, características de nuestros departamentos o cualquier consulta sobre Las Grutas.	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:25:49.808
cmmhuhp7a00aribqc951klq3d	cmmhuhedv00alibqc69w86wp8	text	entrante	huesped	Estoy muy molesta, hace horas que espero una respuesta y nadie me atiende. Es inaceptable.	\N	sim_in_1772979960773	2026-03-08 14:26:00.79
cmmhwf31g00jbibqcyuey1l7g	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! Buen día. ¿Qué necesitás saber sobre nuestros departamentos en Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.8}	\N	2026-03-08 15:19:57.988
cmmhwfkb700jdibqca4bcus7g	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	quiero consultar para mañana somos 2 personas buscamos cerca de la playa	\N	sim_in_1772983220352	2026-03-08 15:20:20.372
cmmhwfmnl00jfibqcppjgbzc3	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Perfecto! Somos 2 personas y buscan cerca de la playa para mañana.\n\nPara poder verificar la disponibilidad, necesito saber: **¿Cuántas noches se van a quedar?**	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-10", "num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-08 15:20:23.41
cmmhwfqk400jhibqcr0uh72qo	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	5 noches	\N	sim_in_1772983228453	2026-03-08 15:20:28.468
cmmhwfuop00jjibqcq1ukb9rq	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Perfecto! Para poder ayudarte con la disponibilidad y el precio para **5 noches**, necesito que me confirmes:\n\n1. **¿Para qué fechas?** (fecha de entrada y salida)\n2. **¿Para cuántas personas?**\n\nCon esos datos te paso las opciones disponibles y los precios exactos.	{"intent": "otro", "entities": {"fecha_salida": "2026-03-10", "num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.5}	\N	2026-03-08 15:20:33.817
cmmhx271m00l4ibqc9wcs7p8p	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772984276241	2026-03-08 15:37:56.266
cmmhx29ka00l6ibqciyzi3sig	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! Buen día. ¿Te gustaría consultar por alojamiento, disponibilidad o algo en particular sobre nuestros departamentos en Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.8}	\N	2026-03-08 15:37:59.53
cmmhx2gm000l8ibqclcjmmjuq	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	somos 2 perosnas para mañana tenes disponible?	\N	sim_in_1772984288647	2026-03-08 15:38:08.664
cmmhx2j9300laibqcgru9hr51	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! Sí, tengo disponibilidad para mañana para 2 personas. \n\nPara darte la información completa, necesito saber: **¿Cuántas noches te vas a quedar?**\n\nCon ese dato te confirmo qué departamentos tenemos disponibles y sus precios.	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-10", "num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-08 15:38:12.087
cmmhx2lrt00lcibqck5gpnwj7	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	3 ncohes	\N	sim_in_1772984295339	2026-03-08 15:38:15.353
cmmhx2ps800leibqc1eg2ttzg	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Perfecto! Para poder ayudarte con las **3 noches**, necesito saber:\n\n1. **¿Para cuántas personas?**\n2. **¿Qué fechas tenés pensadas?** (fecha de entrada y salida)\n\nCon esos datos te confirmo disponibilidad y precios.	{"intent": "otro", "entities": {"fecha_salida": "2026-03-10", "num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.5}	\N	2026-03-08 15:38:20.552
cmmi2m18b00neibqc3w19wm4v	cmmi2k7qz00n0ibqc8r1dvc3f	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-08 18:13:19.932
cmmi2m6go00ngibqcouid17r3	cmmh208er005sibakq0jx8hcd	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-08 18:13:26.713
cmmi2mfza00noibqcmk6pvbfz	cmmi2md3s00nkibqchwucs245	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos 😊\n\n¿En qué puedo ayudarte hoy? ¿Buscas alojamiento para tus próximas vacaciones en Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 18:13:39.046
cmmi2mraa00nqibqc33z3gw89	cmmi2md3s00nkibqchwucs245	text	entrante	huesped	alojamiento para 2 personas desde 10 de marzo	\N	sim_in_1772993633681	2026-03-08 18:13:53.698
cmmi2mu2t00nsibqc0e5jsz4g	cmmi2md3s00nkibqchwucs245	text	saliente	bot	¡Perfecto! Tenemos disponibilidad para 2 personas desde el 10 de marzo de 2026.\n\n¿Cuántas noches pensaban quedarse? Así puedo calcularles el precio total y mostrarles las mejores opciones de departamentos.	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "2", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-08 18:13:57.317
cmmi2mxeb00nuibqcnmr4rwd4	cmmi2md3s00nkibqchwucs245	text	entrante	huesped	5	\N	sim_in_1772993641603	2026-03-08 18:14:01.619
cmmi2n37500nwibqch34e0v7b	cmmi2md3s00nkibqchwucs245	text	saliente	bot	¡Perfecto! Para 2 personas del 10 al 15 de marzo (5 noches) tenemos estas opciones disponibles:\n\n**Luminar Mono** (monoambiente): $325.000 total\n- A 2-3 cuadras de la playa, aire acondicionado, TV, Wi-Fi, cocina completa, estacionamiento cubierto\n\n**Luminar 2Amb** (2 ambientes): $350.000 total  \n- A 2 cuadras del mar, dormitorio separado, patio con parrilla, aire acondicionado, Smart TV, Wi-Fi\n\n**LG** (2 ambientes): $400.000 total\n- A 2 cuadras del mar, solarium con ventanales, parrilla, aire acondicionado, TV LED, estacionamiento cubierto\n\n¿Cuál te interesa más o querés que te cuente más detalles de alguno?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-15", "num_personas": "2", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-08 18:14:09.133
cmmi2nqjj00nyibqcefgc5dqz	cmmi2md3s00nkibqchwucs245	text	entrante	huesped	me pasas fotos de limunar monoambiente	\N	sim_in_1772993679362	2026-03-08 18:14:39.391
cmmi2nr9f00o0ibqcjnhs6vg9	cmmi2md3s00nkibqchwucs245	text	saliente	bot	[3 fotos de Luminar Mono]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Luminar Mono", "fecha_salida": "2026-03-15", "num_personas": "2", "fecha_entrada": "2026-03-10"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-08 18:14:40.323
cmmhueldo0090ibqc9runnp1h	cmmhue3ce008sibqcx3ed614o	text	saliente	bot	¡Perfecto! Te cuento la disponibilidad para 2 personas del 9 al 10 de marzo:\n\n**Opciones disponibles:**\n\n- **Luminar Mono** (monoambiente): $65.000 por noche\n- **Luminar 2Amb** (2 ambientes con parrilla): $70.000 por noche  \n- **LG** (2 ambientes): $80.000 por noche\n\nEl departamento **Pewmafe** requiere mínimo 2 noches para esta fecha, por lo que si querés alojarte ahí tendrías que extender tu estadía.\n\n¿Cuál de estas opciones te interesa? Si querés, te puedo contar más detalles de cada uno para que elijas el que mejor se adapte a lo que buscás.	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-10", "num_personas": "2", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-08 14:23:35.868
cmmhueozi0095ibqcoj7tt5nz	cmmhueoz30093ibqc462bn54a	text	entrante	huesped	Hola buenas tardes	\N	sim_in_1772979820507	2026-03-08 14:23:40.543
cmmhuerzl0097ibqc18dozn70	cmmhueoz30093ibqc462bn54a	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte? ¿Te gustaría consultar disponibilidad, conocer nuestros alojamientos o tenés alguna otra consulta?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:23:44.432
cmmhufalx009gibqcg1dso6m3	cmmhufalm009eibqc5p3syc41	text	entrante	huesped	Hola, cuanto sale por noche el departamento LG?	\N	sim_in_1772979848542	2026-03-08 14:24:08.566
cmmhuflfk009nibqc82cwm901	cmmhuflfd009libqcfkg4wzv7	text	entrante	huesped	Hola! que actividades se pueden hacer en Las Grutas?	\N	sim_in_1772979862567	2026-03-08 14:24:22.592
cmmhugbhb00a3ibqcvda91abu	cmmhug73n009zibqcr17dczrr	text	saliente	bot	¡Hola! Claro, te cuento sobre el departamento LG.\n\nEs un departamento de 2 ambientes de 50 m², ubicado en Golfo San Jorge 560, a solo 2 cuadras del mar (bajada Los Acantilados). Tiene capacidad para hasta 4 personas, con 1 dormitorio y 1 baño.\n\nEn cuanto a amenities, cuenta con: aire acondicionado, TV LED, Wi-Fi, cable TV, cocina equipada con heladera y microondas, solarium con ventanales amplios, parrilla, estacionamiento cubierto dentro del complejo y ropa de cama incluida (las toallas NO están incluidas).\n\n¿Para cuántas personas y qué fechas lo necesitarías?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "LG"}, "confidence": 0.95}	\N	2026-03-08 14:24:56.351
cmmhughwt00a8ibqc4t5dslu4	cmmhughwm00a6ibqcjp5mz1vy	text	entrante	huesped	Hola, quiero hacer una reserva	\N	sim_in_1772979904668	2026-03-08 14:25:04.686
cmmhuglbz00aaibqccdodlnot	cmmhughwm00a6ibqcjp5mz1vy	text	saliente	bot	¡Hola! ¿Cómo estás? Claro, con gusto te ayudo con tu reserva.\n\nPara poder ofrecerte las mejores opciones, necesito que me cuentes:\n\n- ¿Para cuántas personas sería?\n- ¿Qué fechas tenés pensadas para el ingreso y la salida?\n- ¿Cuántas noches se quedarían?	{"intent": "reservar", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:25:09.119
cmmhv8eu100bbibqcu2u68hmn	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772981207033	2026-03-08 14:46:47.066
cmmhv8h5c00bdibqc5vpsx4uq	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! ¿Cómo estás? ¿En qué puedo ayudarte hoy con tu alojamiento en Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:46:50.064
cmmhv8zbj00bfibqclti6bw0c	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	estoy buscando para alquiler el 10 de marzo somos 4 personas y un perro	\N	sim_in_1772981233604	2026-03-08 14:47:13.616
cmmhv92kv00bhibqcmx4eg0u3	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Hola, gracias por tu consulta. Tengo que informarte que lamentablemente **no admitimos mascotas** en ninguno de nuestros departamentos.\n\nSi decidís venir sin el perro, tenemos opciones disponibles para 4 personas el 10 de marzo. Solo necesitaría saber **¿cuántas noches se van a quedar?** para confirmarte disponibilidad y precio.\n\n¿Te gustaría conocer las opciones sin mascota?	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-08 14:47:17.839
cmmhv9o4g00bjibqcanyflm8y	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	bueno bien son 5 noches	\N	sim_in_1772981265749	2026-03-08 14:47:45.76
cmmhv9qo800blibqcrtdxr8z1	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Perfecto, tengo que para **5 noches** a partir de mañana necesitás alojamiento. \n\nPara poder mostrarte las opciones disponibles, necesito saber:\n\n**¿Para cuántas personas es?**	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-15", "num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.85}	\N	2026-03-08 14:47:49.064
cmmi2nz8600o2ibqcoxugeb1y	cmmi2md3s00nkibqchwucs245	text	entrante	huesped	como hago para reservarlo ?	\N	sim_in_1772993690628	2026-03-08 18:14:50.646
cmmjva8x3000bibrcszxv412z	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	Entendido, son 8 personas con entrada mañana 10 de marzo en Pewmafe.\n\nSolo me falta saber: ¿cuántas noches se van a quedar?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "num_personas": "8", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 00:23:45.063
cmmjvac2q000dibrcmibbrlmq	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	4	\N	sim_in_1773102229125	2026-03-10 00:23:49.155
cmmjvaezf000fibrczr24ulzj	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	Perfecto. Lamentablemente tengo que informarte que Pewmafe no está disponible para las fechas del 10 al 14 de marzo, ya tiene reserva.\n\n¿Te gustaría que te sugiera otras fechas disponibles para Pewmafe, o preferís que te cuente sobre otros departamentos disponibles para esas fechas?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-15", "num_personas": "8", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 00:23:52.923
cmmhuezsd0099ibqccwqy7dht	cmmhueoz30093ibqc462bn54a	text	entrante	huesped	Consulta por alojamiento, somos 10 personas, es para la noche de manana solamente	\N	sim_in_1772979834524	2026-03-08 14:23:54.541
cmmhuf5gl009bibqc42na6jie	cmmhueoz30093ibqc462bn54a	text	saliente	bot	Hola, gracias por tu consulta. Para 10 personas, necesitarías reservar varios departamentos ya que la capacidad máxima por unidad es de 4 personas.\n\nTe cuento las opciones disponibles para mañana (9 de marzo):\n\n**Pewmafe** ($70.000/noche): Requiere mínimo 2 noches en temporada baja, por lo que no podría ser para 1 sola noche.\n\n**Luminar 2Amb** ($70.000/noche): 1 unidad disponible, hasta 4 personas.\n\n**LG** ($80.000/noche): Tenemos 5 unidades disponibles, cada una hasta 4 personas.\n\n**Luminar Mono** ($65.000/noche): 1 unidad disponible, hasta 3 personas.\n\nPara alojar a las 10 personas podrías combinar, por ejemplo: 2 deptos LG + 1 Luminar 2Amb (total $230.000 la noche), o bien 3 LG (total $240.000). \n\n¿Te gustaría que te arme alguna combinación específica de departamentos?	{"intent": "consulta_alojamiento", "entities": {"fecha_salida": "2026-03-10", "num_personas": "10", "fecha_entrada": "2026-03-09"}, "confidence": 0.85}	\N	2026-03-08 14:24:01.892
cmmhufdig009iibqcawh4y17a	cmmhufalm009eibqc5p3syc41	text	saliente	bot	¡Hola! ¿Cómo estás? \n\nPara darte el precio exacto del departamento LG, necesito que me digas para qué fechas lo necesitarías y cuántas personas van a ser. Así te paso el precio que corresponde a esa temporada.	{"intent": "consulta_precio", "entities": {"habitacion": "LG"}, "confidence": 0.95}	\N	2026-03-08 14:24:12.329
cmmhufsxq009pibqcy1o57jss	cmmhuflfd009libqcfkg4wzv7	text	saliente	bot	¡Hola! ¿Cómo andás? En Las Grutas hay muchas actividades para disfrutar:\n\n**Playas y mar**: Podés visitar varias playas como la Principal, La Rinconada, Los Acantilados o Piedras Coloradas. Lo más característico son las grutas naturales en los acantilados. También hay buceo y snorkel en aguas cristalinas donde se ven pulpos, estrellas de mar y nudibranquios.\n\n**Deportes y aventura**: Hay kayak, stand up paddle, pesca embarcada y desde costa, y mountain bike por senderos costeros.\n\n**Naturaleza**: Avistaje de fauna marina como lobos marinos, toninas y ballenas (de junio a diciembre). A 100 km está la Pinguinera de El Condor, la más grande de Sudamérica continental.\n\n**Gastronomía y paseos**: Podés probar rabas, pulpo, mejillones y cordero patagónico. En verano hay vida nocturna con bares, restaurantes sobre la costanera y feria artesanal.\n\n¿Te interesa alguna actividad en particular o querés saber sobre alojamiento para tus fechas?	{"intent": "consulta_zona", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:24:32.318
cmmhufw9a009uibqccun6ghxc	cmmhufw8y009sibqcgjgnjb7q	text	entrante	huesped	Hola, quiero el Pewmafe para 1 noche, manana	\N	sim_in_1772979876599	2026-03-08 14:24:36.622
cmmhufz76009wibqcp0r4foop	cmmhufw8y009sibqcgjgnjb7q	text	saliente	bot	Hola, ¿cómo estás? Gracias por tu consulta.\n\nEl departamento Pewmafe está disponible para esas fechas, pero te comento que requiere una estadía mínima de 2 noches en temporada baja. ¿Podrías quedarte una noche más? Serían 2 noches a $70.000 por noche, total $140.000.\n\n¿Para cuántas personas sería la reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-10", "fecha_entrada": "2026-03-09"}, "confidence": 0.9}	\N	2026-03-08 14:24:40.434
cmmhug74300a1ibqcclsvf2xo	cmmhug73n009zibqcr17dczrr	text	entrante	huesped	Hola, me podrias contar sobre el departamento LG? que amenities tiene?	\N	sim_in_1772979890648	2026-03-08 14:24:50.691
cmmjvsayt0001ibk0tdfodcpf	cmmju6u2f0007ibc4fha6tzts	system	saliente	sistema	Conversacion cerrada	\N	\N	2026-03-10 00:37:47.524
cmmjvsifg0005ibk0xddp3gpi	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	hola	\N	sim_in_1773103077123	2026-03-10 00:37:57.196
cmmjvskr40007ibk0w4yato88	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Querés consultar disponibilidad, precios o información sobre nuestros alojamientos?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-10 00:38:00.207
cmmjy7xan00qjibk0vs0fj031	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Quiero averiguar para unas vacaciones, somos 3 personas	\N	sim_in_1773107155511	2026-03-10 01:45:55.536
cmmjy80sc00qlibk0uw24ht6o	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Perfecto, para 3 personas tenemos varias opciones disponibles. Para poder ayudarte mejor, ¿para qué fechas estarías buscando? Necesito saber la fecha de entrada y la fecha de salida, o cuántas noches pensabas quedarte.	{"intent": "consulta_alojamiento", "entities": {"num_personas": "3"}, "confidence": 0.7}	\N	2026-03-10 01:46:00.056
cmmjy883q00qnibk0fqwa2mar	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Que departamentos tienen?	\N	sim_in_1773107169526	2026-03-10 01:46:09.542
cmmjy8fkv00qpibk0gic19gy6	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Para 3 personas tenemos estas opciones:\n\n**Luminar Mono** (Golfo San Jorge 560): Monoambiente de 35-40 m², ideal para 3 personas. Tiene aire acondicionado, TV con cable, Wi-Fi, cocina completa, solarium y estacionamiento cubierto. Sin restricción de estadía mínima, a 2-3 cuadras de la playa.\n\n**Pewmafe** (Punta Perdices 370): Departamento de 2 ambientes para hasta 4 personas, a solo 2 cuadras de la playa. Incluye aire acondicionado, Smart TV, Wi-Fi, patio individual con parrilla y cochera propia.\n\n**Luminar 2Amb** (Golfo San Jorge 560): Departamento de 2 ambientes para hasta 4 personas. Tiene Smart TV, aire acondicionado, Wi-Fi, patio cubierto con parrilla y estacionamiento. Sin restricción de estadía mínima.\n\n**LG** (Golfo San Jorge 560): Departamento de 2 ambientes de 50 m² para hasta 4 personas, con aire acondicionado, TV LED, Wi-Fi, parrilla y estacionamiento cubierto. A 2 cuadras del mar.\n\n¿Para qué fechas estarías necesitando? Así puedo informarte disponibilidad y precios exactos.	{"intent": "consulta_alojamiento", "entities": {"num_personas": "3"}, "confidence": 0.95}	\N	2026-03-10 01:46:19.229
cmms0yhgc001xibagiy0dhi9w	cmms0yhfi001vibaglmsege7t	text	entrante	huesped	hola	\N	sim_in_1773595483282	2026-03-15 17:24:43.357
cmmi2o3u900o4ibqc7r57a409	cmmi2md3s00nkibqchwucs245	text	saliente	bot	¡Perfecto! Te resumo la reserva:\n\n**Luminar Mono**\n- Fechas: 10 al 15 de marzo de 2026 (5 noches)\n- Personas: 2\n- Total: $325.000\n\nPara confirmar la pre-reserva, se abona una seña del 30% ($97.500) por transferencia bancaria a esta cuenta:\n\n**Banco:** Banco Nación\n**Titular:** Laura Beatriz Crocce\n**CBU:** 0110599820059909382856\n**Alias:** GRUTAS.DPTO\n\nEl saldo restante ($227.500) se abona por transferencia al momento del check-in.\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Luminar Mono", "fecha_salida": "2026-03-15", "num_personas": "2", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-08 18:14:56.625
cmmi2z05v00opibqck84sayw8	cmmi2ywbt00olibqc93rlznim	text	saliente	bot	¡Hola! ¿Cómo estás? Perfecto, te consulto por 3 noches en nuestro departamento LG (Golfo San Jorge 560, a 2 cuadras del mar).\n\nPara poder verificar la disponibilidad y darte el precio exacto, necesito que me confirmes:\n\n- ¿Para qué fechas querés hospedarte? (fecha de entrada y salida)\n- ¿Para cuántas personas?\n\nAsí puedo chequear si tenemos disponibilidad y pasarte toda la info. ¿Me confirmás esos datos?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "LG"}, "confidence": 0.85}	\N	2026-03-08 18:23:25.075
cmmi30vqi00pvibqcsvpk0gid	cmmi30p8t00pribqcmg69mcdt	text	saliente	bot	Hola! ¿Cómo andás? Te cuento que para alojar a 6 personas, tendrían que reservar más de un departamento, ya que nuestras unidades tienen capacidad máxima de 4 personas cada una.\n\nPara el 23 al 26 de marzo (3 noches, temporada baja), tenemos disponibilidad en todos nuestros departamentos. Algunas opciones para 6 personas serían:\n\n• **Opción 1:** 2 departamentos Pewmafe (hasta 4 personas c/u) - $420.000 total ($210.000 cada uno)\n• **Opción 2:** 1 Luminar 2Amb + 1 Luminar Mono (4 + 3 personas) - $405.000 total\n• **Opción 3:** 1 depto LG + 1 Luminar Mono (4 + 3 personas) - $435.000 total\n\nTodos están a 2-3 cuadras de la playa, con cocina equipada, aire acondicionado y Wi-Fi. Los Pewmafe tienen parrilla individual y patio, mientras que los Luminar y LG están en complejos con estacionamiento cubierto.\n\n¿Cuál de estas opciones te resulta más conveniente?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-26", "num_personas": "6", "fecha_entrada": "2026-03-23"}, "confidence": 0.95}	\N	2026-03-08 18:24:52.65
cmmi3102d00q0ibqcidrj20z0	cmmi3102700pyibqcz5d05mwc	text	entrante	huesped	Quiero reservar LG del 2 de abril al 5 de abril para 2 personas	\N	sim_in_1772994298244	2026-03-08 18:24:58.262
cmmi31dps00q9ibqc00n9w86y	cmmi31aw100q5ibqcnl2nqxoj	text	saliente	bot	¡Hola! ¡Bienvenido/a a Las Grutas Departamentos! \n\nPerfecto, para 2 personas tenemos varias opciones disponibles. Para ayudarte mejor, ¿para qué fechas necesitarías el alojamiento? ¿Cuál sería la fecha de entrada y salida?	{"intent": "reservar", "entities": {"num_personas": "2"}, "confidence": 0.95}	\N	2026-03-08 18:25:15.952
cmmi31lph00qbibqc9iqkvk96	cmmi31aw100q5ibqcnl2nqxoj	text	entrante	huesped	Perdona, en realidad somos 4 personas	\N	sim_in_1772994326291	2026-03-08 18:25:26.309
cmmi31pe200qdibqcl70mrhy2	cmmi31aw100q5ibqcnl2nqxoj	text	saliente	bot	¡Perfecto! Para 4 personas tengo varias opciones disponibles que se adaptan a tu grupo.\n\nPara poder mostrarte los departamentos disponibles y darte los precios exactos, ¿me podrías decir para qué fechas necesitarían el alojamiento? ¿Cuál sería la fecha de entrada y la fecha de salida?	{"intent": "reservar", "entities": {"num_personas": "4"}, "confidence": 0.9}	\N	2026-03-08 18:25:31.082
cmmi31wkm00qiibqcndgkjuia	cmmi31wjx00qgibqc1kravy61	text	entrante	huesped	Hola, quiero Pewmafe para 1 noche el 15 de enero, somos 2	\N	sim_in_1772994340332	2026-03-08 18:25:40.39
cmmi32aby00qribqcdhpda6xb	cmmi327d700qnibqctnfqx9lp	text	saliente	bot	¡Perfecto! Te confirmo los datos de tu pre-reserva:\n\n**Departamento:** Luminar Mono\n**Fechas:** 11 al 16 de marzo de 2026 (5 noches)\n**Personas:** 2\n**Precio total:** $325.000 ARS\n\nEl departamento está disponible para esas fechas. ¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Luminar Mono", "fecha_salida": "2026-03-16", "num_personas": "2", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-08 18:25:58.223
cmmju7gfr000jibc4t0urjxux	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	Entiendo, son 4 personas y querés ingresar hoy (9 de marzo). \n\n¿Cuántas noches te vas a quedar? Así puedo consultar disponibilidad y pasarte los precios exactos.	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "4", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-09 23:53:35.221
cmmju7k6e000libc423nz29e7	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	5	\N	sim_in_1773100420046	2026-03-09 23:53:40.07
cmmju7pb8000nibc456oxiuhq	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	Perfecto, ya tengo todo claro: 4 personas, ingreso hoy 9 de marzo, 5 noches (salida el 14 de marzo).\n\nPara esas fechas y cantidad de personas, tengo estas opciones disponibles:\n\n**Luminar 2Amb** (Golfo San Jorge 560): Depto 2 ambientes, hasta 4 personas, aire acondicionado, Smart TV, Wi-Fi, cocina completa, patio con parrilla, estacionamiento cubierto. **Precio total: $350.000 ARS** (5 noches).\n\n**LG** (Golfo San Jorge 560): Depto 2 ambientes, hasta 4 personas, aire acondicionado, TV LED, Wi-Fi, cocina, solarium, parrilla, estacionamiento cubierto. **Precio total: $400.000 ARS** (5 noches).\n\nAmbos están a solo 2 cuadras del mar. ¿Cuál te interesa más o querés más info de alguno?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-14", "num_personas": "4", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-09 23:53:46.724
cmmju8aow000pibc41ou4xh3j	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	para pewmafe tenes disponible ?	\N	sim_in_1773100454408	2026-03-09 23:54:14.432
cmmju8dw0000ribc46m2mosmw	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	Lamentablemente Pewmafe no está disponible para las fechas del 9 al 14 de marzo, ya tiene reserva.\n\n¿Te gustaría que te sugiera fechas alternativas cercanas para Pewmafe, o preferís avanzar con alguna de las opciones disponibles (Luminar 2Amb o LG) para esas fechas?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-14", "num_personas": "4", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-09 23:54:18.577
cmmjvkvsg0001ibq0hk4rkyw2	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	Hola quiero consultar pewmafe del 11 al 15 de marzo para 4 personas	\N	sim_in_1773102721226	2026-03-10 00:32:01.264
cmmhugsqb00acibqc7638l50y	cmmhughwm00a6ibqcjp5mz1vy	text	entrante	huesped	Somos 3 personas	\N	sim_in_1772979918686	2026-03-08 14:25:18.708
cmmhuguvb00aeibqc42cj1mf7	cmmhughwm00a6ibqcjp5mz1vy	text	saliente	bot	Perfecto, para 3 personas tenemos varias opciones disponibles.\n\nAhora necesito saber:\n- ¿Qué fechas tenés pensadas para el ingreso y la salida?\n- ¿Cuántas noches se quedarían?	{"intent": "reservar", "entities": {"num_personas": "3"}, "confidence": 0.95}	\N	2026-03-08 14:25:21.479
cmmhuh3kt00agibqcoi4l1oj5	cmmhughwm00a6ibqcjp5mz1vy	text	entrante	huesped	Del 20 al 25 de abril	\N	sim_in_1772979932742	2026-03-08 14:25:32.765
cmmhvn3wj00e3ibqcet6eu9v1	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772981892667	2026-03-08 14:58:12.739
cmmhvn5rg00e5ibqczin5tzmx	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Hola! Buen día. ¿Qué necesitás saber sobre nuestros departamentos en Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:58:15.148
cmmhvni6j00e7ibqc7pxx9jpp	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	estoy buescando para alquiler mañana somos 4 personas	\N	sim_in_1772981911229	2026-03-08 14:58:31.243
cmmhvnkmr00e9ibqc98knlph1	cmmh208er005sibakq0jx8hcd	text	saliente	bot	¡Perfecto! Para 4 personas tenemos varias opciones disponibles. Solo necesito saber:\n\n**¿Cuántas noches te vas a quedar?**\n\nCon ese dato te confirmo disponibilidad y precio exacto para mañana.	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "4", "fecha_entrada": "2026-03-09"}, "confidence": 0.95}	\N	2026-03-08 14:58:34.42
cmmhvnp8y00ebibqc3q6unz20	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	5 noches	\N	sim_in_1772981920381	2026-03-08 14:58:40.402
cmmhvnsqf00edibqcd8s6ljp3	cmmh208er005sibakq0jx8hcd	text	saliente	bot	Perfecto, 5 noches es una buena estadía. Para poder ayudarte mejor, necesito que me digas:\n\n1. **¿Para cuántas personas?**\n2. **¿Desde qué fecha?** (¿cuándo sería el check-in?)\n\nCon esos datos te muestro los departamentos disponibles y los precios para tu estadía.	{"intent": "otro", "entities": {"num_personas": "4", "fecha_entrada": "2026-03-09"}, "confidence": 0.5}	\N	2026-03-08 14:58:44.919
cmmhwf0qq00j9ibqc12zlr4dn	cmmh208er005sibakq0jx8hcd	text	entrante	huesped	hola	\N	sim_in_1772983194984	2026-03-08 15:19:55.01
cmmhudymk008pibqcvvk85j06	cmmhudshi008libqcycqtm1or	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Querés consultar disponibilidad, conocer nuestros departamentos o tenés alguna pregunta sobre Las Grutas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:23:06.381
cmmhue3cu008uibqcag9ii7z2	cmmhue3ce008sibqcx3ed614o	text	entrante	huesped	Hola!	\N	sim_in_1772979792473	2026-03-08 14:23:12.51
cmmhuh8mt00aiibqcfhb26bz5	cmmhughwm00a6ibqcjp5mz1vy	text	saliente	bot	Perfecto, para 3 personas del 20 al 25 de abril (5 noches) tengo disponibilidad en todos nuestros departamentos:\n\n**Pewmafe** (2 cuadras de la playa): Depto 2 ambientes con patio individual, parrilla, cochera. Total: $350.000 ARS\n\n**Luminar Mono** (2-3 cuadras de la playa): Monoambiente de 35-40m2 con solarium, cochera cubierta. Total: $325.000 ARS\n\n**Luminar 2Amb** (2 cuadras de la playa): Depto 2 ambientes con patio cubierto, parrilla, cochera cubierta. Total: $350.000 ARS\n\n**LG** (2 cuadras de la playa): Depto 2 ambientes de 50m2 con solarium amplio, parrilla, cochera cubierta. Total: $400.000 ARS\n\nTodos tienen aire acondicionado, Wi-Fi, cocina equipada y ropa de cama incluida. ¿Cuál te interesa más?	{"intent": "reservar", "entities": {"fecha_salida": "2026-04-25", "num_personas": "3", "fecha_entrada": "2026-04-20"}, "confidence": 0.95}	\N	2026-03-08 14:25:39.317
cmmhuhee700anibqcb55l7nq4	cmmhuhedv00alibqc69w86wp8	text	entrante	huesped	Hola	\N	sim_in_1772979946759	2026-03-08 14:25:46.783
cmmhuhsdo00atibqcu6nxzhtm	cmmhuhedv00alibqc69w86wp8	system	saliente	sistema	Conversacion escalada por queja del huesped	\N	\N	2026-03-08 14:26:04.908
cmmhuhsdx00avibqc6txr2ozi	cmmhuhedv00alibqc69w86wp8	text	saliente	bot	Lamento muchísimo las demoras en la atención, entiendo perfectamente tu molestia. Voy a escalar tu caso inmediatamente para que un agente se comunique con vos lo antes posible y te brinde la atención que necesitás. \n\nTe pido disculpas nuevamente por la espera. ¿Hay algo urgente con lo que pueda ayudarte mientras tanto?	{"intent": "queja", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:26:04.917
cmmhui00q00b0ibqcn3tutrej	cmmhui00i00ayibqc8bgh13ar	text	entrante	huesped	Hola, solo queria agradecer por la informacion. Muchas gracias, adios!	\N	sim_in_1772979974794	2026-03-08 14:26:14.81
cmmhui22n00b2ibqc6026g2ih	cmmhui00i00ayibqc8bgh13ar	text	saliente	bot	¡De nada! Fue un placer ayudarte. Cualquier cosa que necesites, no dudes en escribirnos. ¡Que tengas un excelente día!	{"intent": "despedida", "entities": {}, "confidence": 0.95}	\N	2026-03-08 14:26:17.47
cmmhuiau700b7ibqcy8bch5xs	cmmhuiau100b5ibqc9li9b45f	text	entrante	huesped	Hola, quiero reservar el Luminar Mono del 10 al 15 de mayo para 2 personas	\N	sim_in_1772979988815	2026-03-08 14:26:28.832
cmmhuidlm00b9ibqcjkxoiost	cmmhuiau100b5ibqc9li9b45f	text	saliente	bot	¡Hola! Perfecto, te confirmo los datos de tu pre-reserva:\n\n**Departamento:** Luminar Mono\n**Fechas:** 10 al 15 de mayo de 2026 (5 noches)\n**Personas:** 2\n**Precio total:** $325.000 ARS\n\nEl departamento está disponible para esas fechas. ¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Luminar Mono", "fecha_salida": "2026-05-15", "num_personas": "2", "fecha_entrada": "2026-05-10"}, "confidence": 0.95}	\N	2026-03-08 14:26:32.41
cmmi2yaqa00o9ibqcgqsjwb22	cmmi2yaos00o7ibqcs09s3b0h	text	entrante	huesped	Hola, somos 4 personas, que tienen disponible del 7 de abril por 3 noches?	\N	sim_in_1772994172027	2026-03-08 18:22:52.115
cmmi2z75v00ouibqc3yb8afsj	cmmi2z75900osibqczttky88v	text	entrante	huesped	Hola, puedo llevar mi perro?	\N	sim_in_1772994214104	2026-03-08 18:23:34.148
cmmi2zaek00owibqcel91ac9g	cmmi2z75900osibqczttky88v	text	saliente	bot	Hola! ¿Cómo estás? \n\nLamentablemente no aceptamos mascotas en ninguno de nuestros departamentos. Entiendo que es importante viajar con tu mascota, pero es una política que aplicamos en todos nuestros alojamientos.\n\n¿Te puedo ayudar con alguna otra consulta sobre disponibilidad o información de los departamentos?	{"intent": "consulta_alojamiento", "entities": {}, "confidence": 0.95}	\N	2026-03-08 18:23:38.348
cmmi2zhz600p1ibqckspsovuw	cmmi2zhyv00ozibqcdwo3vzpy	text	entrante	huesped	Hola quiero reservar LG del 20 al 15 de mayo para 2 personas	\N	sim_in_1772994228135	2026-03-08 18:23:48.163
cmmi2zx0600paibqcitgtt3md	cmmi2zss700p6ibqccqcx4zup	text	saliente	bot	¡Hola! ¿Cómo estás? Te consulto el precio para LG del 10 al 13 de abril para 2 personas.\n\nSon 3 noches en temporada baja, el costo total es de **$240.000 ARS** ($80.000 por noche).\n\nEl departamento LG está a 2 cuadras del mar, tiene capacidad para 4 personas, cuenta con aire acondicionado, Wi-Fi, parrilla en el balcón, estacionamiento cubierto y ropa de cama incluida.\n\n¿Te gustaría reservarlo o necesitás más información?	{"intent": "consulta_precio", "entities": {"habitacion": "LG", "fecha_salida": "2026-04-13", "num_personas": "2", "fecha_entrada": "2026-04-10"}, "confidence": 0.95}	\N	2026-03-08 18:24:07.638
cmmi303n600pfibqcuez9ek3q	cmmi303mn00pdibqc0174pa89	text	entrante	huesped	Hola, me gustaria ver fotos del Pewmafe	\N	sim_in_1772994256198	2026-03-08 18:24:16.242
cmmi3049o00phibqc33tihcxp	cmmi303mn00pdibqc0174pa89	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-08 18:24:17.052
cmmi30efu00pmibqcryzl70i1	cmmi30efn00pkibqchm5c720j	text	entrante	huesped	Quiero reservar Luminar 2Amb del 28 de marzo al 31 de marzo para 3 personas	\N	sim_in_1772994270216	2026-03-08 18:24:30.234
cmmi315v600q2ibqc0614jqka	cmmi3102700pyibqcz5d05mwc	text	saliente	bot	¡Perfecto! Te confirmo los datos de tu pre-reserva para el departamento LG:\n\n📋 **Resumen:**\n- Departamento: LG (Golfo San Jorge 560)\n- Entrada: 2 de abril de 2026 a las 13:00 hs\n- Salida: 5 de abril de 2026 a las 24:00 hs\n- Duración: 3 noches\n- Personas: 2\n- **Precio total: $240.000 ARS**\n\nEl departamento tiene capacidad para 4 personas, 1 dormitorio, baño completo, cocina equipada, aire acondicionado, Wi-Fi, parrilla y está a solo 2 cuadras del mar.\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "LG", "fecha_salida": "2026-04-05", "num_personas": "2", "fecha_entrada": "2026-04-02"}, "confidence": 0.95}	\N	2026-03-08 18:25:05.778
cmmi31awb00q7ibqc3m5pnfoz	cmmi31aw100q5ibqcnl2nqxoj	text	entrante	huesped	Hola, somos 2 personas, queremos reservar	\N	sim_in_1772994312272	2026-03-08 18:25:12.299
cmmi320nr00qkibqcynecf4q4	cmmi31wjx00qgibqc1kravy61	text	saliente	bot	Hola! Gracias por tu consulta.\n\nTe comento que el departamento Pewmafe para esas fechas (temporada alta) requiere una estadía mínima de 3 noches. ¿Te gustaría extender tu estadía hasta el 18 de enero? Así podríamos concretar la reserva.\n\nSi preferís quedarte solo 1 noche, puedo consultar disponibilidad en otros departamentos que no tienen ese requisito de estadía mínima para esas fechas.\n\n¿Qué preferís?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2027-01-16", "num_personas": "2", "fecha_entrada": "2027-01-15"}, "confidence": 0.95}	\N	2026-03-08 18:25:45.687
cmmi327dl00qpibqch04kfnfg	cmmi327d700qnibqctnfqx9lp	text	entrante	huesped	Quiero reservar Luminar Mono del 11 de marzo al 16 de marzo para 2 personas	\N	sim_in_1772994354363	2026-03-08 18:25:54.394
cmmikoeuh00qtibqcbmykx9ij	cmmfe4rpw000sibfsj29p5nzn	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:03.977
cmmikof2r00qvibqc0wm7nnah	cmmfk8ffv000bibb0mu2ce1i1	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.275
cmmikof3t00qxibqc8c4oa91r	cmmfe99520002ibrwh66e0p2c	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.313
cmmikof4g00qzibqcyhz7clct	cmmfh2d9q0002ibfkmfxxj0w5	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.337
cmmikof5100r1ibqcfn2yhjyn	cmm47zucq0002ibko6rop674m	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.357
cmmikof5q00r3ibqcrsnu9yv8	cmmfe5pmn0011ibfsdybe9w0e	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.382
cmmikof6a00r5ibqcajtemr35	cmmfkf8qk0002ibxgub2m4h72	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.402
cmmikof6s00r7ibqcivcfjukc	cmm47zv820009ibko3beup784	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.42
cmmikof7b00r9ibqcarjhvw29	cmmfe332g000eibfs1gkv1hyl	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.439
cmmikof7y00rbibqclt2g0wls	cmmfe4dhu000libfsejkaje0b	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.462
cmmikof8n00rdibqcx6wp6h9l	cmmfehcta0002ib2wrlacf4zy	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.488
cmmikof9400rfibqctued7mc8	cmmfk7oof0004ibb0pb3dwvrj	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.505
cmmikofa100rhibqc2px6rd6f	cmmfk9vu2000mibb0hk2migsi	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-09 02:39:04.537
cmmjv9fsp0001ibrcptwx1h25	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	hola	\N	sim_in_1773102187277	2026-03-10 00:23:07.321
cmmjv9j580003ibrcb9e2sa3r	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte? ¿Querés consultar por otra fecha para Pewmafe o necesitás info sobre algo diferente?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-10 00:23:11.661
cmmjv9xiu0005ibrcf3mrf3bb	cmmju6u2f0007ibc4fha6tzts	text	entrante	huesped	consulta para reservar pewmafe entrando mañana necesito 2 departamentos	\N	sim_in_1773102210259	2026-03-10 00:23:30.294
cmmjva0850007ibrcvj1lsudu	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	Perfecto, entiendo que querés reservar 2 departamentos Pewmafe con entrada mañana (10 de marzo).\n\nPara darte disponibilidad y precio exacto, necesito saber: ¿cuántas noches se van a quedar y cuántas personas son en total?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 00:23:33.797
cmmjvl0r60003ibq0k9vv5v0z	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	¡Buenas noticias! Pewmafe está disponible del 11 al 15 de marzo para 4 personas.\n\nSon 4 noches en temporada baja, el precio total es de **$280.000 ARS** ($70.000 por noche).\n\n¿Querés proceder con la reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-15", "num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 00:32:07.696
cmmjvmyvk0003ibv8d2bjmwtr	cmmju6u2f0007ibc4fha6tzts	text	saliente	bot	¡Hola! Sí, Pewmafe está disponible del 11 al 15 de marzo para 4 personas.\n\nSon 4 noches en temporada baja, el precio total es de **$280.000 ARS** ($70.000 por noche).\n\n¿Querés proceder con la reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-15", "num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 00:33:38.576
cmmjxur0i00iribk0dv6rqbff	cmmjxuovu00inibk0j6abnvei	text	saliente	bot	Hola! Para darte el precio exacto del departamento LG, necesito saber para qué fechas estás consultando. ¿Para cuándo necesitarías el alojamiento?	{"intent": "consulta_precio", "entities": {"habitacion": "LG"}, "confidence": 0.95}	\N	2026-03-10 01:35:40.866
cmmjy8ix100qribk0vuwz5hz9	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Me interesa el Pewmafe, tienen del 12 de junio al 17 de junio?	\N	sim_in_1773107183534	2026-03-10 01:46:23.558
cmmjy8mje00qtibk033jrx5pv	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	¡Excelente elección! El departamento Pewmafe está disponible del 12 al 17 de junio (5 noches). El precio total para 3 personas sería de $350.000 ARS ($70.000 por noche, temporada baja).\n\nEl Pewmafe es un departamento de 2 ambientes muy completo, a solo 2 cuadras de la playa (bajada La Rinconada), con patio individual, parrilla propia, cochera, Smart TV, aire acondicionado y Wi-Fi.\n\n¿Te gustaría avanzar con la pre-reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-06-17", "num_personas": "3", "fecha_entrada": "2026-06-12"}, "confidence": 0.95}	\N	2026-03-10 01:46:28.25
cmmjy8tq300qvibk0989dxe75	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Cuanto saldria en total?	\N	sim_in_1773107197542	2026-03-10 01:46:37.564
cmmjy8yl200qxibk05oza4148	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	El precio total para el departamento Pewmafe del 12 al 17 de junio (5 noches) para 3 personas es de **$350.000 ARS**.\n\nEste monto incluye el alojamiento completo con todos los servicios: aire acondicionado, Smart TV, Wi-Fi, patio individual con parrilla, cochera y ropa de cama (las toallas no están incluidas).\n\nPara confirmar la pre-reserva se abona una seña del 30% ($105.000 ARS) y el saldo restante ($245.000 ARS) se abona por transferencia al momento del check-in.\n\n¿Querés proceder con la reserva?	{"intent": "otro", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-06-17", "num_personas": "3", "fecha_entrada": "2026-06-12"}, "confidence": 0.5}	\N	2026-03-10 01:46:43.862
cmmjy94jn00qzibk0ut12zzi4	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Y si fueran del 12 de junio al 16 de junio, 4 noches?	\N	sim_in_1773107211563	2026-03-10 01:46:51.587
cmmjy97lj00r1ibk0biajamug	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Para el Pewmafe del 12 al 16 de junio (4 noches) para 3 personas, el precio total sería de **$280.000 ARS** ($70.000 por noche, temporada baja).\n\nLa seña del 30% sería de $84.000 ARS y el saldo restante de $196.000 ARS se abonaría por transferencia al momento del check-in.\n\n¿Te conviene mejor esta opción de 4 noches?	{"intent": "otro", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-06-17", "num_personas": "3", "fecha_entrada": "2026-06-12"}, "confidence": 0.5}	\N	2026-03-10 01:46:55.543
cmmjy9fcx00r3ibk0ty1v0tg4	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Tiene parrilla el Pewmafe?	\N	sim_in_1773107225573	2026-03-10 01:47:05.601
cmmjy9hv200r5ibk0oqyzzrim	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Sí, el Pewmafe tiene parrilla individual en su patio privado. Es ideal para disfrutar de unas ricas parrilladas durante tu estadía.\n\n¿Te decidís por las 4 noches entonces (12 al 16 de junio)?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-06-17", "num_personas": "3", "fecha_entrada": "2026-06-12"}, "confidence": 0.95}	\N	2026-03-10 01:47:08.843
cmmjy9q5u00r7ibk0thfjxkw0	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Ok me interesa reservar	\N	sim_in_1773107239588	2026-03-10 01:47:19.603
cmmjy9xlt00r9ibk0t5f81vpk	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Perfecto, te resumo los datos de tu pre-reserva:\n\n**Departamento:** Pewmafe  \n**Fechas:** 12 al 16 de junio de 2026 (4 noches)  \n**Personas:** 3  \n**Precio total:** $280.000 ARS  \n**Seña (30%):** $84.000 ARS  \n**Saldo restante:** $196.000 ARS (se abona al check-in)\n\nLa seña se abona por transferencia bancaria. Acá van los datos de la cuenta:\n\n**Titular:** Sergio Machado  \n**CUIT:** 20295178389  \n**Banco:** Banco Nación  \n**CBU:** 238493824972389472398478923479832  \n**Alias:** es.una.prueba\n\nUna vez que realices la transferencia, enviame el comprobante y tu número de DNI. Un agente va a verificar el pago y te va a enviar la factura por este medio. Recién cuando recibas la factura, la reserva queda confirmada.	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-06-16", "num_personas": "3", "fecha_entrada": "2026-06-12"}, "confidence": 0.95}	\N	2026-03-10 01:47:29.247
cmmjya0z600rbibk09g3tunvi	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Si, quiero proceder	\N	sim_in_1773107253600	2026-03-10 01:47:33.618
cmmkzuw420001ib14e1dp8gkw	cmmi2zss700p6ibqccqcx4zup	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:32.873
cmmkzuw7y0003ib14c13qwemb	cmmi2ywbt00olibqc93rlznim	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.023
cmmkzuw900005ib14hn8k7w0a	cmmi2zhyv00ozibqcdwo3vzpy	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.061
cmmkzuw9z0007ib145rh1zq31	cmmi303mn00pdibqc0174pa89	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.095
cmmkzuwbc0009ib14blepza07	cmmi2z75900osibqczttky88v	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.144
cmmkzuwc9000bib147tku1lmw	cmmi2yaos00o7ibqcs09s3b0h	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.177
cmmkzuwda000dib142y862nxe	cmmi30efn00pkibqchm5c720j	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.214
cmmkzuwe7000fib1408lvxfek	cmmi31aw100q5ibqcnl2nqxoj	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.247
cmmkzuwer000hib14njgtxiui	cmmi327d700qnibqctnfqx9lp	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.267
cmmkzuwf8000jib14zl2azqsw	cmmi2ylhz00oeibqcdpy0g9gp	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.284
cmmkzuwfq000lib148t9ll3a4	cmmi30p8t00pribqcmg69mcdt	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.303
cmmkzuwgb000nib14w2cbl0fl	cmmi3102700pyibqcz5d05mwc	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.324
cmmkzuwgq000pib1481w4on6p	cmmi31wjx00qgibqc1kravy61	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 19:19:33.339
cmmjxuzpk00iwibk0yx08air1	cmmjxuzpc00iuibk03i3hhckm	text	entrante	huesped	Quiero reservar para abril	\N	sim_in_1773106552113	2026-03-10 01:35:52.136
cmmjxv1td00iyibk0lqe86b3p	cmmjxuzpc00iuibk03i3hhckm	text	saliente	bot	¡Perfecto! Para poder ayudarte con la reserva para abril, necesito que me cuentes un par de cosas:\n\n¿Para cuántas personas es la estadía?	{"intent": "reservar", "entities": {}, "confidence": 0.85}	\N	2026-03-10 01:35:54.866
cmmjxvdxx00j5ibk0pkn3aatv	cmmjxvajm00j1ibk0er476lt1	text	saliente	bot	¡Hola! Bienvenidos a Las Grutas Departamentos. \n\nQué bueno que nos contacten para su estadía. Para poder ayudarlos a encontrar el departamento ideal, necesito saber: **¿cuántas personas son en total?**	{"intent": "saludo", "entities": {}, "confidence": 0.85}	\N	2026-03-10 01:36:10.579
cmmjxvle600jaibk08j61pm8v	cmmjxvldj00j8ibk08xkpzqv1	text	entrante	huesped	Disponibilidad del 30 de mayo al 3 de junio para 2 personas en LG?	\N	sim_in_1773106580180	2026-03-10 01:36:20.238
cmmjxvp3i00jcibk0a4ecego6	cmmjxvldj00j8ibk08xkpzqv1	text	saliente	bot	¡Hola! Te confirmo que el departamento LG está disponible para 2 personas del 30 de mayo al 3 de junio de 2026 (4 noches).\n\nEl precio total de la estadía es de $320.000 ARS (corresponde a temporada baja: $80.000 por noche).\n\n¿Te gustaría proceder con la reserva o necesitás más información sobre el departamento?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "LG", "fecha_salida": "2026-06-03", "num_personas": "2", "fecha_entrada": "2026-05-30"}, "confidence": 0.95}	\N	2026-03-10 01:36:25.039
cmmjxvw7l00jhibk055sr96rw	cmmjxvw7a00jfibk039hx73iq	text	entrante	huesped	Tienen algo disponible para hoy? Somos 2	\N	sim_in_1773106594217	2026-03-10 01:36:34.257
cmmjxwvcd00k4ibk04jbgpnmt	cmmjxwsps00k0ibk07gyjhe8b	text	saliente	bot	¡Perfecto! Ya tengo las fechas (del 16 al 23 de marzo, 7 noches). Para poder ofrecerte las mejores opciones, necesito saber: **¿cuántas personas van a viajar?**	{"intent": "reservar", "entities": {"fecha_salida": "2026-03-23", "fecha_entrada": "2026-03-16"}, "confidence": 0.85}	\N	2026-03-10 01:37:19.789
cmmjxx3k300k9ibk0tyvqdq4n	cmmjxx3js00k7ibk0qtu3pwem	text	entrante	huesped	Hola, somos 2 adultos y 3 ninos, total 4 personas	\N	sim_in_1773106650398	2026-03-10 01:37:30.435
cmmjxxf3i00kiibk065loypkg	cmmjxxee800keibk04ffus448	system	saliente	sistema	Conversacion escalada: datos bancarios no disponibles o no verificados para este departamento.	\N	\N	2026-03-10 01:37:45.39
cmmjxxhz800kkibk0nwf7cluz	cmmjxxee800keibk04ffus448	text	saliente	bot	Perfecto! Te resumo los datos de tu pre-reserva:\n\n**Departamento:** Luminar 2Amb\n**Fechas:** 23 al 26 de abril de 2026 (3 noches)\n**Personas:** 4\n**Precio total:** $210.000 ARS\n\n¿Querés proceder con la reserva? Para confirmarla necesitamos una seña del 30% ($63.000 ARS). El saldo restante ($147.000 ARS) se abona al momento del check-in.	{"intent": "reservar", "entities": {"habitacion": "Luminar 2Amb", "fecha_salida": "2026-04-26", "num_personas": "4", "fecha_entrada": "2026-04-23"}, "confidence": 0.95}	\N	2026-03-10 01:37:49.124
cmmjxxp7k00kpibk0k4jmap2e	cmmjxxp7800knibk0o21saza7	text	entrante	huesped	Soy 1 persona, que tienen del 8 de mayo al 11 de mayo?	\N	sim_in_1773106678463	2026-03-10 01:37:58.496
cmmjxy2s700kyibk0021fr7ps	cmmjxy00b00kuibk0n0m8a1hk	text	saliente	bot	Lamentablemente el departamento Pewmafe no tiene disponibilidad para las fechas del 15 al 18 de diciembre de 2026. \n\n¿Te gustaría que te sugiera fechas alternativas cercanas a esas, o preferís consultar por otro de nuestros departamentos que sí tenga disponibilidad en esas fechas?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-12-18", "num_personas": "2", "fecha_entrada": "2026-12-15"}, "confidence": 0.95}	\N	2026-03-10 01:38:16.087
cmmjxyaud00l3ibk0rakz1s7q	cmmjxyau100l1ibk09010zxpw	text	entrante	huesped	Hay disponibilidad en LG del 18 de abril al 21 de abril para 2 personas?	\N	sim_in_1773106706502	2026-03-10 01:38:26.533
cmmjya5cs00rdibk08r5dvuea	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Perfecto! Para avanzar con la pre-reserva, realiza la transferencia de la seña de **$84.000 ARS** a la siguiente cuenta:\n\n**Titular:** Sergio Machado  \n**CUIT:** 20295178389  \n**Banco:** Banco Nación  \n**CBU:** 238493824972389472398478923479832  \n**Alias:** es.una.prueba\n\nUna vez que hayas realizado el pago, enviame por favor:\n- El comprobante de la transferencia\n- Tu número de DNI\n\nCon eso, un agente va a verificar el pago y te enviará la factura por este mismo medio. Cuando recibas la factura, tu reserva quedará confirmada.\n\n¿Alguna consulta sobre el pago?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-06-16", "num_personas": "3", "fecha_entrada": "2026-06-12"}, "confidence": 0.95}	\N	2026-03-10 01:47:39.263
cmmjyabsp00rfibk0cf4ot17t	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Gracias por la info, lo pienso y te aviso	\N	sim_in_1773107267609	2026-03-10 01:47:47.642
cmmjyae5i00rhibk0zmum08o8	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	Dale, sin problema! Tomá tu tiempo para pensarlo. Cualquier duda que tengas sobre el Pewmafe o las fechas, acá estamos para ayudarte.\n\n¡Que tengas un buen día!	{"intent": "despedida", "entities": {}, "confidence": 0.85}	\N	2026-03-10 01:47:50.694
cmms0ykqd001zibagoh1vvz8p	cmms0yhfi001vibaglmsege7t	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte? ¿Querés consultar disponibilidad, precios o tenés alguna duda sobre nuestros alojamientos?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-15 17:24:47.606
cmmjxvak000j3ibk0wonu8jdf	cmmjxvajm00j1ibk0er476lt1	text	entrante	huesped	Hola, somos una familia y queremos alquilar	\N	sim_in_1773106566147	2026-03-10 01:36:06.192
cmmjxvymo00jjibk0ujrt5k60	cmmjxvw7a00jfibk039hx73iq	text	saliente	bot	¡Hola! Sí, tenemos disponibilidad para 2 personas hoy (10 de marzo).\n\nPara poder chequear bien las opciones, ¿cuántas noches pensaban quedarse?	{"intent": "consulta_disponibilidad", "entities": {"num_personas": "2", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-10 01:36:37.392
cmmjxw71c00joibk0lk6xdx45	cmmjxw70z00jmibk054agfyj3	text	entrante	huesped	Hola, me interesa el monoambiente	\N	sim_in_1773106608253	2026-03-10 01:36:48.288
cmmjxwaye00jqibk0ork9va4g	cmmjxw70z00jmibk054agfyj3	text	saliente	bot	¡Hola! Qué bueno que te interesa el Luminar Mono. Es un monoambiente muy cómodo de 35-40 m², ubicado a solo 2-3 cuadras de la playa (bajada Los Acantilados), con aire acondicionado, Wi-Fi, cocina completa y estacionamiento cubierto. Tiene capacidad para hasta 3 personas.\n\nPara darte más info sobre disponibilidad y precio, ¿para cuántas personas sería y qué fechas tenés pensadas para tu estadía?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Luminar Mono"}, "confidence": 0.95}	\N	2026-03-10 01:36:53.364
cmmjxwhwa00jvibk0kyf1ud3z	cmmjxwhvz00jtibk0vp5z6egh	text	entrante	huesped	Hay disponibilidad en Pewmafe o LG del 13 de abril al 16 de abril para 2 personas?	\N	sim_in_1773106622329	2026-03-10 01:37:02.362
cmmjxwm8y00jxibk0p6dnk2v4	cmmjxwhvz00jtibk0vp5z6egh	text	saliente	bot	¡Hola! Sí, tenemos disponibilidad en ambos departamentos para esas fechas.\n\n**Pewmafe** (2 ambientes, a 2 cuadras de la playa): $210.000 ARS total por 3 noches ($70.000 por noche). Tiene patio individual con parrilla y cochera.\n\n**LG** (2 ambientes, a 2 cuadras del mar): $240.000 ARS total por 3 noches ($80.000 por noche). Está en un complejo con estacionamiento cubierto y parrilla.\n\nAmbos son aptos para 2 personas y cuentan con aire acondicionado, Wi-Fi, cocina equipada y ropa de cama incluida. ¿Cuál te interesa más?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-04-16", "num_personas": "2", "fecha_entrada": "2026-04-13"}, "confidence": 0.95}	\N	2026-03-10 01:37:08.002
cmmjxwsq200k2ibk0lwk7xoby	cmmjxwsps00k0ibk07gyjhe8b	text	entrante	huesped	Quiero reservar para la semana que viene	\N	sim_in_1773106636363	2026-03-10 01:37:16.395
cmmjz81yz0001ibp0asxykmce	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	hola	\N	sim_in_1773108841170	2026-03-10 02:14:01.209
cmmjz84950003ibp08guqcsa3	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	¡Hola! ¿En qué puedo ayudarte? ¿Querés consultar disponibilidad, conocer nuestros departamentos o saber sobre precios y reservas?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-10 02:14:04.169
cmmjz8brg0005ibp01bx6useu	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	queria reservar para mañana somos 4 personas	\N	sim_in_1773108853878	2026-03-10 02:14:13.9
cmmjz8een0007ibp0l9tdwqx2	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto, para 4 personas a partir del 11 de marzo. ¿Cuántas noches te gustaría quedarte? Así puedo confirmarte disponibilidad y precio de los departamentos disponibles para tu grupo.	{"intent": "reservar", "entities": {"num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 02:14:17.327
cmmjz8gv70009ibp01c126ndb	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	3	\N	sim_in_1773108860493	2026-03-10 02:14:20.516
cmmjz8lfo000bibp07sre3qdo	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto, tengo disponibilidad para 4 personas del 11 al 14 de marzo (3 noches). Te paso las opciones que tenemos:\n\n**Pewmafe** (2 ambientes, 1 dormitorio, patio y parrilla individual): $210.000 total\n**Luminar 2Amb** (2 ambientes, 1 dormitorio, patio cubierto con parrilla): $210.000 total\n**LG** (2 ambientes, 1 dormitorio, solarium y parrilla): $240.000 total\n\nLos tres tienen aire acondicionado, Wi-Fi, cocina equipada y estacionamiento. ¿Cuál te interesa?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-03-14", "num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 02:14:26.437
cmmjz8sry000dibp0vgjoc28e	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	en pewmafe esta bien, me envias fotos ?	\N	sim_in_1773108875924	2026-03-10 02:14:35.95
cmmjz8tg9000fibp0hvs9w449	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	[3 fotos de Pewmafe]	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-14", "num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95, "photosSent": 3}	\N	2026-03-10 02:14:36.825
cmmjz90sc000hibp013jo0xnb	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	tiene patio ?	\N	sim_in_1773108886314	2026-03-10 02:14:46.332
cmmjz94is000jibp05zu48h4v	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Sí, Pewmafe tiene patio individual con parrilla propia. Además cuenta con cochera para estacionamiento. Está a solo 2 cuadras de la playa (bajada La Rinconada).\n\n¿Querés proceder con la reserva para el 11 al 14 de marzo entonces?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-14", "num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 02:14:51.171
cmmjza444000libp0zl0qfqcl	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	si pero perdon que hora tenes aca en argentina 23.15 mañana es 10 de marzo	\N	sim_in_1773108937268	2026-03-10 02:15:37.3
cmmjza75r000nibp0aq0zincz	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Tenés razón, disculpá la confusión. Si mañana es 10 de marzo, entonces la reserva sería del **10 al 13 de marzo** (3 noches), ¿correcto? \n\nDejame verificar la disponibilidad para esas fechas y te confirmo el precio.	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-14", "num_personas": "4", "fecha_entrada": "2026-03-11"}, "confidence": 0.95}	\N	2026-03-10 02:15:41.247
cmmjzaci6000pibp0wl8ng0wk	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	si correcto	\N	sim_in_1773108948150	2026-03-10 02:15:48.174
cmmjzafw7000ribp00akql69d	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto. Te confirmo la reserva para **Pewmafe del 10 al 13 de marzo** (3 noches) para 4 personas.\n\n**Precio total: $210.000** ($70.000 por noche, temporada baja)\n\nPara confirmar la reserva necesito una seña del 40% ($84.000). El resto ($126.000) lo abonás por transferencia al momento del check-in.\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-13", "num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-10 02:15:52.567
cmmjzaj9b000tibp010zp1kju	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	si	\N	sim_in_1773108956904	2026-03-10 02:15:56.927
cmmjxx6jt00kbibk0uooi5h9w	cmmjxx3js00k7ibk0qtu3pwem	text	saliente	bot	¡Hola! Bienvenidos a Las Grutas Departamentos. \n\nPerfecto, son 4 personas en total. Para poder ayudarlos con la disponibilidad y precios, ¿para qué fechas están buscando alojamiento y cuántas noches se quedarían?	{"intent": "saludo", "entities": {"num_personas": "5"}, "confidence": 0.85}	\N	2026-03-10 01:37:34.314
cmmjxxef100kgibk0k6jukcj4	cmmjxxee800keibk04ffus448	text	entrante	huesped	Somos 4 personas, quiero Luminar 2Amb del 23 de abril al 26 de abril	\N	sim_in_1773106664430	2026-03-10 01:37:44.509
cmmjxxtmh00kribk0yv2tqoo5	cmmjxxp7800knibk0o21saza7	text	saliente	bot	Hola! Tenemos disponibilidad para esas fechas (del 8 al 11 de mayo, 3 noches). Te cuento las opciones para 1 persona:\n\n- **Pewmafe** (2 amb, a 2 cuadras de la playa): $210.000 total\n- **Luminar Mono** (monoambiente, a 2-3 cuadras): $195.000 total\n- **Luminar 2Amb** (2 amb, a 2 cuadras): $210.000 total\n- **LG** (2 amb, a 2 cuadras del mar): $240.000 total\n\nTodos incluyen ropa de cama, Wi-Fi, aire acondicionado y estacionamiento. ¿Cuál te interesa conocer más o te gustaría reservar?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-05-11", "num_personas": "1", "fecha_entrada": "2026-05-08"}, "confidence": 0.95}	\N	2026-03-10 01:38:04.217
cmmjxy00p00kwibk0029jz9yf	cmmjxy00b00kuibk0n0m8a1hk	text	entrante	huesped	Quiero Pewmafe del 15 al 18 de diciembre para 2 personas	\N	sim_in_1773106692477	2026-03-10 01:38:12.505
cmmjxydmi00l5ibk06czrc2fd	cmmjxyau100l1ibk09010zxpw	text	saliente	bot	Lamentablemente no tenemos disponibilidad en LG para esas fechas (18 al 21 de abril de 2026). \n\n¿Te gustaría que revise disponibilidad para fechas cercanas o preferís consultar por alguno de nuestros otros departamentos que sí tienen lugar para 2 personas en esas fechas?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "LG", "fecha_salida": "2026-04-21", "num_personas": "2", "fecha_entrada": "2026-04-18"}, "confidence": 0.95}	\N	2026-03-10 01:38:30.138
cmmjxylnk00laibk0m6h85s6w	cmmjxylnc00l8ibk0248ut24f	text	entrante	huesped	Hay disponibilidad en Luminar 2Amb del 28 de abril al 1 de mayo para 2 personas?	\N	sim_in_1773106720522	2026-03-10 01:38:40.545
cmmjxz1fg00ljibk08gnmt82i	cmmjxywiz00lfibk0fgk6q0yn	text	saliente	bot	¡Hola! Sí, tenemos disponibilidad en Pewmafe para 2 personas del 3 al 6 de mayo de 2026 (3 noches). El precio total sería de $210.000 ARS ($70.000 por noche, temporada baja).\n\n¿Te gustaría que avancemos con la pre-reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-06", "num_personas": "2", "fecha_entrada": "2026-05-03"}, "confidence": 0.95}	\N	2026-03-10 01:39:00.988
cmmjxz7c800loibk0q2uanv1m	cmmjxz7by00lmibk0puha5b6a	text	entrante	huesped	Disculpa, puedo hablar con alguien de atencion al cliente?	\N	sim_in_1773106748612	2026-03-10 01:39:08.649
cmmjxza2o00lqibk030p21v4k	cmmjxz7by00lmibk0puha5b6a	system	saliente	sistema	Huesped solicito hablar con un agente	\N	\N	2026-03-10 01:39:12.192
cmmjxza3500lsibk0287winf2	cmmjxz7by00lmibk0puha5b6a	text	saliente	bot	¡Por supuesto! Un agente de nuestro equipo se va a poner en contacto con vos en breve por este mismo medio.\n\nMientras tanto, si tenes alguna consulta sobre disponibilidad, precios o características de los departamentos, puedo ayudarte. ¿Hay algo que quieras saber?	{"intent": "hablar_humano", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:39:12.209
cmmjxzi5z00lxibk0hmuv8xdw	cmmjxzi5q00lvibk0swiz6joa	text	entrante	huesped	Quiero 5 noches en Pewmafe para 2 personas	\N	sim_in_1773106762644	2026-03-10 01:39:22.679
cmmjxzlg600lzibk042wzehdg	cmmjxzi5q00lvibk0swiz6joa	text	saliente	bot	Perfecto! Pewmafe es ideal para 2 personas. Para confirmar disponibilidad y darte el precio exacto, ¿para qué fechas necesitás el alojamiento? Decime la fecha de entrada (check-in) y salida (check-out), o bien desde qué día querés hospedarte.	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "num_personas": "2"}, "confidence": 0.95}	\N	2026-03-10 01:39:26.931
cmmjxzszf00m4ibk0nogqhxma	cmmjxzsz600m2ibk06l00k5wl	text	entrante	huesped	Quiero reservar hasta el 20 de mayo para 2 personas	\N	sim_in_1773106776668	2026-03-10 01:39:36.699
cmmjy06q800mdibk023fr07sl	cmmjy03su00m9ibk09fnniest	text	saliente	bot	¡Hola! Sí, claro que sí. \n\nPara mostrarte las fotos más adecuadas a lo que buscás, ¿me contás para cuántas personas necesitás el departamento y qué fechas tenés en mente? Así te muestro las opciones que mejor se ajusten a tu estadía.	{"intent": "consulta_alojamiento", "entities": {}, "confidence": 0.9}	\N	2026-03-10 01:39:54.513
cmmjy0enc00miibk052i4y1wi	cmmjy0emu00mgibk0n9ju1era	text	entrante	huesped	Hola, como llego desde Buenos Aires a Las Grutas?	\N	sim_in_1773106804737	2026-03-10 01:40:04.776
cmmjy0kv900mkibk0ejn5go2l	cmmjy0emu00mgibk0n9ju1era	text	saliente	bot	¡Hola! Te cuento las opciones para llegar desde Buenos Aires a Las Grutas:\n\n**En auto**: Son aproximadamente 1.000 km por Ruta Nacional 3. El viaje dura entre 10-12 horas. Podes hacer paradas en Bahía Blanca o Carmen de Patagones.\n\n**En micro**: Hay varias empresas que hacen el recorrido directo desde Retiro hasta Las Grutas (Don Otto, Cóndor Estrella, entre otras). El viaje dura unas 14-16 horas. Te recomiendo consultar horarios y comprar pasajes con anticipación, especialmente en temporada alta.\n\n**En avión**: Podes volar de Buenos Aires a Viedma (aeropuerto más cercano, a 100 km de Las Grutas). Desde ahí, hay traslados en combi/remis que te llevan directo a Las Grutas en aproximadamente 1 hora.\n\n¿Te puedo ayudar en algo más sobre tu viaje o con información de nuestros departamentos?	{"intent": "consulta_zona", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:40:12.837
cmmjy0phz00mpibk0ujon2lr1	cmmjy0phm00mnibk0nuubrqux	text	entrante	huesped	Hay restaurantes o lugares para comer cerca?	\N	sim_in_1773106818806	2026-03-10 01:40:18.839
cmmjy0tll00mribk0mb5qo93l	cmmjy0phm00mnibk0nuubrqux	text	saliente	bot	¡Claro que sí! Las Grutas tiene muy buena oferta gastronómica, especialmente sobre la costanera. Vas a encontrar restaurantes y parrillas que ofrecen especialidades del mar como rabas, pulpo, mejillones y pescados frescos, además de cordero patagónico.\n\nEn la temporada de verano hay mucha vida nocturna con bares y restaurantes abiertos hasta tarde, y también una feria artesanal. Los deptos están a pocas cuadras de la zona comercial y gastronómica, todo muy accesible caminando.\n\n¿Te gustaría que te ayude con algo más sobre tu visita a Las Grutas?	{"intent": "consulta_zona", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:40:24.15
cmmjy10ca00mwibk0y20rltoo	cmmjy10bs00muibk0ga8oxvne	text	entrante	huesped	kiero el lg pa 2 personas	\N	sim_in_1773106832846	2026-03-10 01:40:32.89
cmmjy12pa00n0ibk0v6wbftaa	cmmjy10bs00muibk0ga8oxvne	text	saliente	bot	¡Perfecto! El departamento LG es ideal para 2 personas. \n\nPara poder darte el precio exacto y verificar la disponibilidad, necesito que me digas las fechas: ¿cuándo querés llegar y cuándo te irías?	{"intent": "reservar", "entities": {"habitacion": "LG", "num_personas": "2"}, "confidence": 0.85}	\N	2026-03-10 01:40:35.95
cmmjy1b5v00n5ibk01pn3g618	cmmjy1b5h00n3ibk0yr7w5i8a	text	entrante	huesped	Tienen wifi? Aceptan mascotas? Y hay parrilla?	\N	sim_in_1773106846885	2026-03-10 01:40:46.915
cmmjxyody00lcibk097xsgxci	cmmjxylnc00l8ibk0248ut24f	text	saliente	bot	¡Hola! Sí, tenemos disponibilidad en Luminar 2Amb para esas fechas. \n\nPara 2 personas del 28 de abril al 1 de mayo (3 noches), el costo total es de $210.000 ARS ($70.000 por noche en temporada baja).\n\n¿Te gustaría hacer la reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Luminar 2Amb", "fecha_salida": "2026-05-01", "num_personas": "2", "fecha_entrada": "2026-04-28"}, "confidence": 0.95}	\N	2026-03-10 01:38:44.086
cmmjxywjs00lhibk088cfy0er	cmmjxywiz00lfibk0fgk6q0yn	text	entrante	huesped	Hay disponibilidad en Pewmafe del 3 de mayo al 6 de mayo para 2 personas?	\N	sim_in_1773106734575	2026-03-10 01:38:54.664
cmmjxzvqg00m6ibk0oy49aaim	cmmjxzsz600m2ibk06l00k5wl	text	saliente	bot	¡Perfecto! Para poder ayudarte con la reserva, necesito saber desde qué fecha querés ingresar. ¿A partir de qué día necesitás el alojamiento?	{"intent": "reservar", "entities": {"fecha_salida": "2026-05-20", "num_personas": "2"}, "confidence": 0.95}	\N	2026-03-10 01:39:40.264
cmmjy03t400mbibk0psl8guiu	cmmjy03su00m9ibk09fnniest	text	entrante	huesped	Me podrias mandar fotos?	\N	sim_in_1773106790693	2026-03-10 01:39:50.728
cmmjy10yl00myibk03w7n4t3u	cmmjy10bs00muibk0ga8oxvne	system	saliente	sistema	Conversacion escalada: datos bancarios no disponibles o no verificados para este departamento.	\N	\N	2026-03-10 01:40:33.693
cmmjy1ra700neibk0s5yttmls	cmmjy1lzl00naibk07uoz0poq	text	saliente	bot	¡Perfecto! Para esas fechas (29 de marzo al 1 de abril, 3 noches) tenemos disponibilidad en todos nuestros departamentos para 2 personas:\n\n**Pewmafe** - 2 ambientes con patio y parrilla individual ($210.000 total)\n**Luminar Mono** - Monoambiente compacto ($195.000 total)\n**Luminar 2Amb** - 2 ambientes con patio y parrilla ($210.000 total)\n**LG** - 2 ambientes con balcón y parrilla ($240.000 total)\n\nTodos están a 2-3 cuadras de la playa, tienen aire acondicionado, Wi-Fi y cocina equipada. ¿Alguno te interesa en particular o querés que te cuente más detalles de alguno?	{"intent": "consulta_disponibilidad", "entities": {"fecha_salida": "2026-04-01", "num_personas": "2", "fecha_entrada": "2026-03-29"}, "confidence": 0.95}	\N	2026-03-10 01:41:07.807
cmmjy1wsi00ngibk0oyv8aznj	cmmjy1lzl00naibk07uoz0poq	text	entrante	huesped	Dame el Pewmafe	\N	sim_in_1773106874935	2026-03-10 01:41:14.946
cmmjy203o00niibk0ze4pwqpn	cmmjy1lzl00naibk07uoz0poq	text	saliente	bot	¡Excelente elección! Te resumo la pre-reserva:\n\n**Pewmafe** - 2 ambientes\n- Fechas: 29 de marzo al 1 de abril (3 noches)\n- Personas: 2\n- Precio total: $210.000 ARS\n\nEl departamento tiene dormitorio independiente, aire acondicionado, Smart TV, Wi-Fi, cocina equipada, patio con parrilla individual y estacionamiento. Está a 2 cuadras de la playa (bajada La Rinconada).\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-01", "num_personas": "2", "fecha_entrada": "2026-03-29"}, "confidence": 0.95}	\N	2026-03-10 01:41:19.234
cmmjy27n900nnibk0if3wgk42	cmmjy27mz00nlibk0lz74wcyc	text	entrante	huesped	Somos 3 para Pewmafe del 3 de abril al 6 de abril	\N	sim_in_1773106888975	2026-03-10 01:41:29.014
cmmjy2awx00npibk0occflv2f	cmmjy27mz00nlibk0lz74wcyc	text	saliente	bot	¡Perfecto! Te confirmo que Pewmafe está disponible para 3 personas del 3 al 6 de abril de 2026 (3 noches).\n\nEl precio total es de **$210.000 ARS** ($70.000 por noche en temporada baja).\n\n¿Querés proceder con la pre-reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-06", "num_personas": "3", "fecha_entrada": "2026-04-03"}, "confidence": 0.95}	\N	2026-03-10 01:41:33.249
cmmjy2ig900nribk0tb660q0w	cmmjy27mz00nlibk0lz74wcyc	text	entrante	huesped	Mejor del 8 de abril al 11 de abril	\N	sim_in_1773106902991	2026-03-10 01:41:43.018
cmmjy2kfg00ntibk00bnw1yxk	cmmjy27mz00nlibk0lz74wcyc	text	saliente	bot	Perfecto, te confirmo que Pewmafe está disponible para 3 personas del 8 al 11 de abril de 2026 (3 noches).\n\nEl precio total sigue siendo de **$210.000 ARS** ($70.000 por noche en temporada baja).\n\n¿Querés proceder con la pre-reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-04-11", "num_personas": "3", "fecha_entrada": "2026-04-08"}, "confidence": 0.95}	\N	2026-03-10 01:41:45.58
cmmjy2tb300nyibk0frnbepou	cmmjy2tak00nwibk0asrizk4h	text	entrante	huesped	Quiero reservar LG del 13 de abril al 16 de abril para 2 personas	\N	sim_in_1773106917035	2026-03-10 01:41:57.088
cmmjy2u1000o0ibk0k9dj52yx	cmmjy2tak00nwibk0asrizk4h	system	saliente	sistema	Conversacion escalada: datos bancarios no disponibles o no verificados para este departamento.	\N	\N	2026-03-10 01:41:58.021
cmmjy4os100ozibk0k92fq97y	cmmjy4m7j00otibk0y7r90arb	text	saliente	bot	Perfecto, te confirmo los datos de la pre-reserva:\n\n📋 **Resumen:**\n- Departamento: LG\n- Fechas: 28 al 31 de mayo de 2026 (3 noches)\n- Personas: 2\n- Precio total: $240.000 ARS\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "LG", "fecha_salida": "2026-05-31", "num_personas": "2", "fecha_entrada": "2026-05-28"}, "confidence": 0.95}	\N	2026-03-10 01:43:24.53
cmmjzamng000vibp00940u279	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto. La seña se abona por transferencia bancaria a esta cuenta:\n\n**Datos bancarios:**\n- Titular: Sergio Machado\n- CUIT: 20295178389\n- Banco: Banco Nación\n- CBU: 238493824972389472398478923479832\n- Alias: es.una.prueba\n\n**Monto de la seña: $84.000**\n\nEl saldo restante ($126.000) lo abonás por transferencia al momento del check-in.\n\nUna vez que realices la transferencia, enviame el comprobante y tu número de DNI por favor.	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-13", "num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-10 02:16:01.324
cmmjzatcn000xibp0jlfj4wm0	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	ok ya tenvie el comprobante	\N	sim_in_1773108969984	2026-03-10 02:16:10.007
cmmjzawyu000zibp09ry56d1k	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto, recibí el comprobante. ¿Me pasás también tu número de DNI por favor?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-13", "num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-10 02:16:14.694
cmmjy1f9j00n7ibk0a5olpsdb	cmmjy1b5h00n3ibk0yr7w5i8a	text	saliente	bot	Hola! Te respondo tus consultas:\n\n**WiFi:** Sí, todos nuestros departamentos tienen WiFi incluido.\n\n**Mascotas:** No, lamentablemente no se admiten mascotas en ninguno de nuestros alojamientos.\n\n**Parrilla:** Sí, tenemos parrilla disponible. Pewmafe tiene parrilla individual en cada patio, Luminar 2Amb tiene parrilla en el patio cubierto, y LG también cuenta con parrilla. El único que no tiene es Luminar Mono (monoambiente).\n\n¿Para cuántas personas estás buscando y qué fechas tenías pensado?	{"intent": "consulta_alojamiento", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:40:52.231
cmmjy1lzx00ncibk0aoxorgss	cmmjy1lzl00naibk07uoz0poq	text	entrante	huesped	Somos 2 personas, del 29 de marzo al 1 de abril	\N	sim_in_1773106860919	2026-03-10 01:41:00.958
cmmjy2we800o2ibk0fc2zjxkz	cmmjy2tak00nwibk0asrizk4h	text	saliente	bot	¡Perfecto! Te confirmo los datos de tu pre-reserva:\n\n**Departamento LG**\n- Entrada: 13/04/2026\n- Salida: 16/04/2026\n- 3 noches para 2 personas\n- **Precio total: $240.000 ARS**\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "LG", "fecha_salida": "2026-04-16", "num_personas": "2", "fecha_entrada": "2026-04-13"}, "confidence": 0.95}	\N	2026-03-10 01:42:01.089
cmmjy343b00o4ibk00urx0rz6	cmmjy2tak00nwibk0asrizk4h	text	entrante	huesped	Sabes que, mejor comunicame con un agente humano	\N	sim_in_1773106931045	2026-03-10 01:42:11.063
cmmjy3exr00o9ibk0h3le98aw	cmmjy3exd00o7ibk0jnaeovn5	text	entrante	huesped	Quiero reservar Pewmafe del 18 de mayo al 21 de mayo para 2 personas	\N	sim_in_1773106945079	2026-03-10 01:42:25.119
cmmjy3i6c00obibk0t6tv781i	cmmjy3exd00o7ibk0jnaeovn5	text	saliente	bot	Perfecto! Te confirmo los datos de tu pre-reserva:\n\n**Departamento:** Pewmafe\n**Fechas:** 18 al 21 de mayo de 2026 (3 noches)\n**Personas:** 2\n**Precio total:** $210.000 ARS\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-21", "num_personas": "2", "fecha_entrada": "2026-05-18"}, "confidence": 0.95}	\N	2026-03-10 01:42:29.316
cmmjzb3ck0011ibp0mgnnf6jm	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	si 295167898	\N	sim_in_1773108982890	2026-03-10 02:16:22.965
cmmjzb6a50013ibp0qfy716dx	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto, ya tengo el comprobante y tu DNI. Un agente va a verificar el pago y te va a enviar la factura por este mismo medio. Recién cuando recibas la factura, la reserva queda confirmada.\n\n¿Necesitás algo más?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-13", "num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-10 02:16:26.766
cmmjzbkgz0015ibp0zpc8suoa	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	toallas tiene o tengo que llevar ?	\N	sim_in_1773109005123	2026-03-10 02:16:45.155
cmmjzbmws0017ibp05yh83ch7	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Tenés que llevar toallas. Pewmafe incluye la ropa de cama pero las toallas NO están incluidas.\n\n¿Algo más que necesites saber?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-03-13", "num_personas": "4", "fecha_entrada": "2026-03-10"}, "confidence": 0.95}	\N	2026-03-10 02:16:48.316
cmmjzc2dm0019ibp0v8w52oiy	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	de la playa cuantas cuadras esta?	\N	sim_in_1773109028336	2026-03-10 02:17:08.362
cmmjzc5as001bibp08p8kxcde	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Está a 2 cuadras de la playa, por la bajada La Rinconada. Muy cerquita para ir caminando.\n\n¿Alguna otra consulta?	{"intent": "consulta_zona", "entities": {"habitacion": "Pewmafe"}, "confidence": 0.95}	\N	2026-03-10 02:17:12.148
cmmjzcclk001dibp0ajrcaa50	cmmjvsieb0003ibk0lxix7tv3	text	entrante	huesped	no gracias aguardo la factura	\N	sim_in_1773109041581	2026-03-10 02:17:21.608
cmmjzcey5001fibp0i4urwo0e	cmmjvsieb0003ibk0lxix7tv3	text	saliente	bot	Perfecto, quedamos en contacto. Cualquier cosa que necesites, estamos por acá. ¡Que tengas un buen día!	{"intent": "despedida", "entities": {}, "confidence": 0.95}	\N	2026-03-10 02:17:24.651
cmms0vuux0001ibag18r93950	cmmjxxp7800knibk0o21saza7	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.76
cmms0vuvy0003ibag2wz4zptb	cmmjxyau100l1ibk09010zxpw	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.798
cmms0vuw90005ibagu995w9c5	cmmjxue1s00igibk06lsjzt0v	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.809
cmms0vuwy0007ibagvy9oxd74	cmmjxy00b00kuibk0n0m8a1hk	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.834
cmms0vux90009ibagjsxvl9m0	cmmjxuovu00inibk0j6abnvei	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.845
cmms0vuxl000bibagnplmfbu8	cmmjxylnc00l8ibk0248ut24f	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.857
cmms0vuya000dibagondjlwde	cmmjxuzpc00iuibk03i3hhckm	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.883
cmms0vuyv000fibag7kwk8sre	cmmjxywiz00lfibk0fgk6q0yn	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.904
cmms0vuzl000hibagigqiggzr	cmmjy03su00m9ibk09fnniest	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.929
cmms0vuzu000jibagqahu3lxi	cmmjy27mz00nlibk0lz74wcyc	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.938
cmms0vv02000libag49bwxe00	cmmjxvldj00j8ibk08xkpzqv1	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.947
cmms0vv0h000nibageilx8cf7	cmmjxvw7a00jfibk039hx73iq	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.961
cmms0vv0s000pibagwxm728sc	cmmjxx3js00k7ibk0qtu3pwem	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.972
cmms0vv15000ribag41nqtdu2	cmmjxvajm00j1ibk0er476lt1	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.985
cmms0vv1g000tibag9jdrd5rh	cmmjxz7by00lmibk0puha5b6a	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:40.996
cmms0vv1p000vibag6fwdn86o	cmmjy40kg00oiibk01aa5an2i	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.005
cmms0vv21000xibagf1fee2pz	cmmjxzi5q00lvibk0swiz6joa	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.017
cmms0vv2d000zibag5ys8ztaq	cmmjxw70z00jmibk054agfyj3	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.029
cmmjy3prt00odibk0p70oaq31	cmmjy3exd00o7ibk0jnaeovn5	text	entrante	huesped	Puedo pagar con tarjeta de credito?	\N	sim_in_1773106959094	2026-03-10 01:42:39.162
cmmjy3tuj00ofibk0r4n0xnsc	cmmjy3exd00o7ibk0jnaeovn5	text	saliente	bot	Sí, podés pagar la seña del 30% con tarjeta de crédito a través de MercadoPago. Te aclaro que esta opción tiene un recargo del 8% por el costo del servicio.\n\nLa seña sería de $63.000 ARS (30% de $210.000), y con el recargo del 8% quedaría en $68.040 ARS.\n\nEl saldo restante de $147.000 ARS se abona por transferencia bancaria al momento del check-in.\n\n¿Querés que te pase el link de pago de MercadoPago?	{"intent": "consulta_alojamiento", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-21", "num_personas": "2", "fecha_entrada": "2026-05-18"}, "confidence": 0.7}	\N	2026-03-10 01:42:44.444
cmmjy40lb00okibk0tqpedb3k	cmmjy40kg00oiibk01aa5an2i	text	entrante	huesped	Quiero Pewmafe del 23 de mayo al 26 de mayo para 2 personas	\N	sim_in_1773106973127	2026-03-10 01:42:53.183
cmmjy441n00omibk0nn29zdlm	cmmjy40kg00oiibk01aa5an2i	text	saliente	bot	Perfecto! Te confirmo la disponibilidad para Pewmafe:\n\n📅 Entrada: 23 de mayo de 2026\n📅 Salida: 26 de mayo de 2026\n👥 2 personas\n🏠 3 noches en Pewmafe (2 ambientes, hasta 4 personas)\n\n💰 Precio total: $210.000 ARS ($70.000 por noche - temporada baja)\n\n¿Querés proceder con la pre-reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-26", "num_personas": "2", "fecha_entrada": "2026-05-23"}, "confidence": 0.95}	\N	2026-03-10 01:42:57.659
cmmjy4be300ooibk0g8vqf0k9	cmmjy40kg00oiibk01aa5an2i	text	entrante	huesped	Mejor dame el LG	\N	sim_in_1773106987147	2026-03-10 01:43:07.179
cmmjy4eoi00oqibk0aowevgur	cmmjy40kg00oiibk01aa5an2i	text	saliente	bot	Perfecto! Te confirmo entonces para LG:\n\n📅 Entrada: 23 de mayo de 2026\n📅 Salida: 26 de mayo de 2026\n👥 2 personas\n🏠 3 noches en LG (2 ambientes, hasta 4 personas, a 2 cuadras del mar)\n\n💰 Precio total: $240.000 ARS ($80.000 por noche - temporada baja)\n\n¿Querés proceder con la pre-reserva?	{"intent": "consulta_disponibilidad", "entities": {"habitacion": "LG", "fecha_salida": "2026-05-26", "num_personas": "2", "fecha_entrada": "2026-05-23"}, "confidence": 0.95}	\N	2026-03-10 01:43:11.442
cmmjy4m7w00ovibk02o0jy93e	cmmjy4m7j00otibk0y7r90arb	text	entrante	huesped	Somos 2 para LG del 28 de mayo al 31 de mayo	\N	sim_in_1773107001177	2026-03-10 01:43:21.212
cmmjy4mu200oxibk0pcms5sp7	cmmjy4m7j00otibk0y7r90arb	system	saliente	sistema	Conversacion escalada: datos bancarios no disponibles o no verificados para este departamento.	\N	\N	2026-03-10 01:43:22.011
cmmjy4x0r00p1ibk0mwkghni8	cmmjy4m7j00otibk0y7r90arb	text	entrante	huesped	Cambio: ahora somos 4 personas, y las fechas del 2 de junio al 6 de junio	\N	sim_in_1773107015189	2026-03-10 01:43:35.212
cmmjy57v700p8ibk0w0zp8c09	cmmjy57us00p6ibk01uc2zh6i	text	entrante	huesped	Quiero reservar	\N	sim_in_1773107029222	2026-03-10 01:43:49.267
cmmjy7ol800qhibk03l624ctm	cmmjy7mho00qdibk0guca83sn	text	saliente	bot	¡Buenas tardes! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Te gustaría consultar disponibilidad, precios o información sobre nuestros departamentos?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:45:44.252
cmmkqrrr60001ib14h5w3m7vw	cmmhudshi008libqcycqtm1or	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.719
cmmkqrrsd0003ib14z1fety2z	cmmhueoz30093ibqc462bn54a	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.765
cmmkqrrsx0005ib1466sc7wo7	cmmhuiau100b5ibqc9li9b45f	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.785
cmmkqrrtc0007ib145whj9vh4	cmmhufalm009eibqc5p3syc41	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.801
cmmkqrrtp0009ib14nd9ntwf2	cmmhuflfd009libqcfkg4wzv7	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.813
cmmkqrru2000bib14b68lqeaq	cmmhuhedv00alibqc69w86wp8	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.826
cmmkqrrue000dib14j21axna6	cmmhughwm00a6ibqcjp5mz1vy	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.839
cmmkqrruo000fib14657w6oha	cmmhue3ce008sibqcx3ed614o	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.849
cmmkqrrv0000hib14azicb5gx	cmmhug73n009zibqcr17dczrr	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.861
cmmkqrrvc000jib1469qa89b6	cmmhufw8y009sibqcgjgnjb7q	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-10 15:05:10.872
cmms0vv2m0011ibaghnzy8kiw	cmmjxwhvz00jtibk0vp5z6egh	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.039
cmms0vv2x0013ibagojjx4fz3	cmmjxzsz600m2ibk06l00k5wl	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.049
cmms0vv3c0015ibagfeygapgn	cmmjy10bs00muibk0ga8oxvne	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.064
cmms0vv3o0017ibagr4xf9gze	cmmjxwsps00k0ibk07gyjhe8b	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.077
cmms0vv4l0019ibagb93vy5e2	cmmjy0emu00mgibk0n9ju1era	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.109
cmms0vv5h001bibagl1nghctl	cmmjy0phm00mnibk0nuubrqux	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.141
cmms0vv5q001dibagja71kmae	cmmjy4m7j00otibk0y7r90arb	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.15
cmms0vv5y001fibagb7oviq3k	cmmjy57us00p6ibk01uc2zh6i	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.158
cmms0vv68001hibagpn3hdnyr	cmmjxxee800keibk04ffus448	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.169
cmms0vv6p001jibag84eq5y3e	cmmjy1b5h00n3ibk0yr7w5i8a	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.186
cmms0vv79001libagrmi40zb2	cmmkvj4lq0002iblsaob4pj9l	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.205
cmms0vv7p001nibag4dada0i7	cmmjy6f4g00puibk0gd4316nq	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.222
cmms0vv7y001pibag7b1836fn	cmmjy5thg00pjibk0c8r3fg1e	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.231
cmms0vv86001ribagxgajqdgu	cmmjy1lzl00naibk07uoz0poq	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.238
cmmjxue1z00iiibk0vbpp508n	cmmjxue1s00igibk06lsjzt0v	text	entrante	huesped	Buenas, como andan?	\N	sim_in_1773106524041	2026-03-10 01:35:24.071
cmmjxugbr00ikibk09a8emfyo	cmmjxue1s00igibk06lsjzt0v	text	saliente	bot	¡Hola! ¿Cómo estás? Bienvenido a Las Grutas Departamentos.\n\n¿En qué puedo ayudarte hoy? ¿Buscás alojamiento para venir a Las Grutas o querés consultar algo en particular?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:35:27.015
cmmjxuowl00ipibk0773bqxhw	cmmjxuovu00inibk0j6abnvei	text	entrante	huesped	Hola, cuanto sale LG?	\N	sim_in_1773106538070	2026-03-10 01:35:38.133
cmmjy54s300p3ibk0pkl97b7s	cmmjy2tak00nwibk0asrizk4h	system	saliente	sistema	Agente admin@chatboot.com tomo el control de la conversacion	\N	\N	2026-03-10 01:43:45.267
cmmjy59rq00paibk0l7v40jig	cmmjy2tak00nwibk0asrizk4h	text	saliente	agente	hola como puedo ayudarte ?	\N	\N	2026-03-10 01:43:51.735
cmmjy59v800pcibk0n16nx2hn	cmmjy57us00p6ibk01uc2zh6i	text	saliente	bot	¡Hola! Perfecto, vamos a ayudarte con la reserva 😊\n\nPara poder ofrecerte las mejores opciones, necesito que me confirmes: **¿Para cuántas personas es la reserva?**	{"intent": "reservar", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:43:51.86
cmmjy5io100peibk06bdijyn1	cmmjy57us00p6ibk01uc2zh6i	text	entrante	huesped	ok	\N	sim_in_1773107043239	2026-03-10 01:44:03.265
cmmjy5ko100pgibk0l4apst2x	cmmjy57us00p6ibk01uc2zh6i	text	saliente	bot	¿Para cuántas personas querés hacer la reserva? Así puedo mostrarte los departamentos disponibles que se ajusten a tu grupo.	{"intent": "otro", "entities": {}, "confidence": 0.3}	\N	2026-03-10 01:44:05.857
cmmjy5thz00plibk0pb4swm7o	cmmjy5thg00pjibk0c8r3fg1e	text	entrante	huesped	Quiero hablar con un agente por favor	\N	sim_in_1773107057254	2026-03-10 01:44:17.303
cmmjy5wud00pnibk0wkcr1z4r	cmmjy5thg00pjibk0c8r3fg1e	system	saliente	sistema	Huesped solicito hablar con un agente	\N	\N	2026-03-10 01:44:21.634
cmmjy5wus00ppibk07u8aalfk	cmmjy5thg00pjibk0c8r3fg1e	text	saliente	bot	¡Claro! Te voy a transferir con un agente humano que te va a atender en breve. Cualquier consulta sobre disponibilidad, precios o reservas, te la van a resolver enseguida.\n\nSi preferís, también podés comunicarte directamente al +54 2920 561033 o escribirnos a lasgrutasdepartamentos@gmail.com.\n\n¿Hay algo más en lo que pueda ayudarte mientras esperás?	{"intent": "hablar_humano", "entities": {}, "confidence": 0.95}	\N	2026-03-10 01:44:21.652
cmmjy64ay00pribk0cddu9dmk	cmmjy5thg00pjibk0c8r3fg1e	text	entrante	huesped	Hola? Hay alguien?	\N	sim_in_1773107071291	2026-03-10 01:44:31.307
cmmjy6f4m00pwibk029cukla3	cmmjy6f4g00puibk0gd4316nq	text	entrante	huesped	Quiero reservar Pewmafe del 13 de mayo al 16 de mayo para 2 personas	\N	sim_in_1773107085316	2026-03-10 01:44:45.335
cmmjy6hlt00pyibk0tbg6c8m8	cmmjy6f4g00puibk0gd4316nq	text	saliente	bot	¡Perfecto! Te confirmo los datos de tu pre-reserva:\n\n**Departamento:** Pewmafe  \n**Fechas:** 13 al 16 de mayo de 2026 (3 noches)  \n**Personas:** 2  \n**Precio total:** $210.000 ARS\n\n¿Querés proceder con la reserva?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-16", "num_personas": "2", "fecha_entrada": "2026-05-13"}, "confidence": 0.95}	\N	2026-03-10 01:44:48.546
cmmjy6pxx00q0ibk0rfnwjbx5	cmmjy6f4g00puibk0gd4316nq	text	entrante	huesped	Si, quiero proceder con la reserva	\N	sim_in_1773107099334	2026-03-10 01:44:59.349
cmmjy6v9q00q2ibk0z0qvphvv	cmmjy6f4g00puibk0gd4316nq	text	saliente	bot	¡Excelente! Para avanzar con la pre-reserva, la seña del 30% es de **$63.000 ARS** y se abona por transferencia bancaria a la siguiente cuenta:\n\n**Titular:** Sergio Machado  \n**CUIT:** 20295178389  \n**Banco:** Banco Nación  \n**CBU:** 238493824972389472398478923479832  \n**Alias:** es.una.prueba\n\nEl saldo restante de $147.000 ARS se abona por transferencia al momento del check-in.\n\nUna vez que realices la transferencia, enviame el comprobante y tu número de DNI para que un agente verifique el pago y te envíe la factura. Recién cuando recibas la factura, tu reserva quedará confirmada.	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-16", "num_personas": "2", "fecha_entrada": "2026-05-13"}, "confidence": 0.95}	\N	2026-03-10 01:45:06.254
cmmjy70sf00q4ibk0wsz8p5d6	cmmjy6f4g00puibk0gd4316nq	text	entrante	huesped	Ya realice la transferencia	\N	sim_in_1773107113380	2026-03-10 01:45:13.407
cmmjy73hd00q6ibk0k0u6wcqe	cmmjy6f4g00puibk0gd4316nq	text	saliente	bot	Perfecto, ahora necesito que me envíes:\n\n1. El comprobante de la transferencia\n2. Tu número de DNI\n\nUna vez que los reciba, un agente va a verificar el pago y te va a enviar la factura por este mismo medio. Cuando recibas la factura, tu reserva quedará confirmada.	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-16", "num_personas": "2", "fecha_entrada": "2026-05-13"}, "confidence": 0.95}	\N	2026-03-10 01:45:16.897
cmmjy7bnj00q8ibk08nweyxf5	cmmjy6f4g00puibk0gd4316nq	text	entrante	huesped	Mi DNI es 30123456, adjunto el comprobante	\N	sim_in_1773107127460	2026-03-10 01:45:27.487
cmmjy7e2900qaibk04x0d5ngv	cmmjy6f4g00puibk0gd4316nq	text	saliente	bot	¡Perfecto! Ya recibí tu DNI (30.123.456) y el comprobante de transferencia.\n\nUn agente va a verificar el pago en breve y te va a enviar la factura por este mismo medio. Una vez que recibas la factura, tu pre-reserva del departamento Pewmafe del 13 al 16 de mayo quedará confirmada.\n\n¿Hay algo más en lo que pueda ayudarte mientras tanto?	{"intent": "reservar", "entities": {"habitacion": "Pewmafe", "fecha_salida": "2026-05-16", "num_personas": "2", "fecha_entrada": "2026-05-13"}, "confidence": 0.95}	\N	2026-03-10 01:45:30.607
cmmjy7mii00qfibk06d73gb6r	cmmjy7mho00qdibk0guca83sn	text	entrante	huesped	Buenas tardes	\N	sim_in_1773107141489	2026-03-10 01:45:41.562
cmmkvj4mn0004iblsr9geyrwl	cmmkvj4lq0002iblsaob4pj9l	text	entrante	huesped	hola	\N	sim_in_1773163105509	2026-03-10 17:18:25.583
cmmkvj9ai0006ibls8hbvvl92	cmmkvj4lq0002iblsaob4pj9l	text	saliente	bot	¡Hola! Bienvenido a Las Grutas Departamentos. ¿En qué puedo ayudarte hoy? ¿Te interesa conocer nuestros alojamientos, consultar disponibilidad o hacer una reserva?	{"intent": "saludo", "entities": {}, "confidence": 0.95}	\N	2026-03-10 17:18:31.627
cmms0vv8d001tibagxvbdakcw	cmmjy3exd00o7ibk0jnaeovn5	system	saliente	sistema	Conversacion cerrada automaticamente por inactividad (48h)	\N	\N	2026-03-15 17:22:41.245
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservas (id, huesped_id, conversacion_id, fecha_entrada, fecha_salida, num_huespedes, habitacion, precio_total, estado, notas, creado_en, actualizado_en, importe_usd, monto_reserva, nombre_huesped, nro_factura, origen_reserva, saldo, tarifa_noche, telefono_huesped) FROM stdin;
cmmfnz2qb0000ibsoqkldyrzq	\N	\N	2026-03-11 00:00:00	2026-03-14 00:00:00	1	Pewmafe	261000.000000000000000000000000000000	completada	saldo paga al ingreso	2026-03-07 01:48:01.809	2026-03-10 01:18:19.814	\N	130551.000000000000000000000000000000	Macarena	\N	booking	130551.000000000000000000000000000000	87000.000000000000000000000000000000	1162239293
cmmjxucg50004ib0guoxbl13j	cmmjxucft0000ib0grh45u3tm	cmmjxucfz0002ib0g1q1pcbcm	2026-04-18 00:00:00	2026-04-21 00:00:00	2	LG	0.000000000000000000000000000000	pre_reserva	\N	2026-03-10 01:35:21.989	2026-03-10 01:35:21.989	\N	\N	Setup QA-S16	\N	\N	\N	\N	\N
cmmjxucgk0009ib0g2e3vq0pu	cmmjxucga0005ib0gcl8yoofq	cmmjxucgf0007ib0g8nmvt5gx	2026-04-28 00:00:00	2026-05-01 00:00:00	2	Luminar 2Amb	0.000000000000000000000000000000	completada	\N	2026-03-10 01:35:22.005	2026-03-10 01:35:22.005	\N	\N	Setup QA-S17	\N	\N	\N	\N	\N
cmmjxuch1000eib0gmvluyzt1	cmmjxucgq000aib0glo8hvcvn	cmmjxucgv000cib0gevpdavm3	2026-05-03 00:00:00	2026-05-06 00:00:00	2	Pewmafe	0.000000000000000000000000000000	cancelada	\N	2026-03-10 01:35:22.021	2026-03-10 01:35:22.021	\N	\N	Setup QA-S18	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tarifas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tarifas (id, complejo_id, temporada, precio_noche, estadia_minima) FROM stdin;
cmmfli0dv000bibnwat8kulax	cmmfli0du000aibnwm5xfvig5	baja	65000.000000000000000000000000000000	\N
cmmfli0dv000cibnwoc1c6iav	cmmfli0du000aibnwm5xfvig5	media	85000.000000000000000000000000000000	\N
cmmfli0dv000dibnwrj99v0ox	cmmfli0du000aibnwm5xfvig5	alta	100000.000000000000000000000000000000	\N
cmmfli0ec000jibnwrmczrctw	cmmfli0ec000iibnwg07zkpy8	baja	70000.000000000000000000000000000000	\N
cmmfli0ec000kibnwzz3j0u7l	cmmfli0ec000iibnwg07zkpy8	media	90000.000000000000000000000000000000	\N
cmmfli0ec000libnwembcpidw	cmmfli0ec000iibnwg07zkpy8	alta	120000.000000000000000000000000000000	\N
cmmfli0ek000tibnwlru28v1f	cmmfli0ek000sibnw1y5xo5eq	baja	80000.000000000000000000000000000000	\N
cmmfli0ek000uibnwlaiofdx8	cmmfli0ek000sibnw1y5xo5eq	media	95000.000000000000000000000000000000	\N
cmmfli0ek000vibnwfgiqfn1n	cmmfli0ek000sibnw1y5xo5eq	alta	130000.000000000000000000000000000000	\N
cmmfli0dg0003ibnw8tylc423	cmmfli0dg0000ibnwjrbo81yn	alta	120000.000000000000000000000000000000	3
cmmfli0dg0002ibnwbs155zo9	cmmfli0dg0000ibnwjrbo81yn	media	90000.000000000000000000000000000000	3
cmmfli0dg0001ibnwxs38vmpm	cmmfli0dg0000ibnwjrbo81yn	baja	70000.000000000000000000000000000000	2
\.


--
-- Data for Name: tarifas_especiales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tarifas_especiales (id, complejo_id, fecha_inicio, fecha_fin, precio_noche, estadia_minima, motivo, activo, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: wa_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wa_templates (id, nombre, idioma, contenido, activo, creado_en) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: agentes agentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agentes
    ADD CONSTRAINT agentes_pkey PRIMARY KEY (id);


--
-- Name: bloqueos bloqueos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloqueos
    ADD CONSTRAINT bloqueos_pkey PRIMARY KEY (id);


--
-- Name: bot_config bot_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bot_config
    ADD CONSTRAINT bot_config_pkey PRIMARY KEY (id);


--
-- Name: complejos complejos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.complejos
    ADD CONSTRAINT complejos_pkey PRIMARY KEY (id);


--
-- Name: conversaciones conversaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversaciones
    ADD CONSTRAINT conversaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- Name: media_files media_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_pkey PRIMARY KEY (id);


--
-- Name: mensajes mensajes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: tarifas_especiales tarifas_especiales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifas_especiales
    ADD CONSTRAINT tarifas_especiales_pkey PRIMARY KEY (id);


--
-- Name: tarifas tarifas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifas
    ADD CONSTRAINT tarifas_pkey PRIMARY KEY (id);


--
-- Name: wa_templates wa_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wa_templates
    ADD CONSTRAINT wa_templates_pkey PRIMARY KEY (id);


--
-- Name: agentes_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX agentes_email_key ON public.agentes USING btree (email);


--
-- Name: complejos_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX complejos_nombre_key ON public.complejos USING btree (nombre);


--
-- Name: huespedes_wa_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX huespedes_wa_id_key ON public.huespedes USING btree (wa_id);


--
-- Name: inventario_fecha_habitacion_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX inventario_fecha_habitacion_key ON public.inventario USING btree (fecha, habitacion);


--
-- Name: mensajes_conversacion_id_creado_en_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX mensajes_conversacion_id_creado_en_idx ON public.mensajes USING btree (conversacion_id, creado_en);


--
-- Name: mensajes_wa_message_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX mensajes_wa_message_id_key ON public.mensajes USING btree (wa_message_id);


--
-- Name: tarifas_complejo_id_temporada_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tarifas_complejo_id_temporada_key ON public.tarifas USING btree (complejo_id, temporada);


--
-- Name: wa_templates_nombre_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wa_templates_nombre_key ON public.wa_templates USING btree (nombre);


--
-- Name: bloqueos bloqueos_complejo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bloqueos
    ADD CONSTRAINT bloqueos_complejo_id_fkey FOREIGN KEY (complejo_id) REFERENCES public.complejos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversaciones conversaciones_agente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversaciones
    ADD CONSTRAINT conversaciones_agente_id_fkey FOREIGN KEY (agente_id) REFERENCES public.agentes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversaciones conversaciones_huesped_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversaciones
    ADD CONSTRAINT conversaciones_huesped_id_fkey FOREIGN KEY (huesped_id) REFERENCES public.huespedes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: media_files media_files_complejo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media_files
    ADD CONSTRAINT media_files_complejo_id_fkey FOREIGN KEY (complejo_id) REFERENCES public.complejos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mensajes mensajes_conversacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mensajes
    ADD CONSTRAINT mensajes_conversacion_id_fkey FOREIGN KEY (conversacion_id) REFERENCES public.conversaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reservas reservas_conversacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_conversacion_id_fkey FOREIGN KEY (conversacion_id) REFERENCES public.conversaciones(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reservas reservas_huesped_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_huesped_id_fkey FOREIGN KEY (huesped_id) REFERENCES public.huespedes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tarifas tarifas_complejo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifas
    ADD CONSTRAINT tarifas_complejo_id_fkey FOREIGN KEY (complejo_id) REFERENCES public.complejos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tarifas_especiales tarifas_especiales_complejo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarifas_especiales
    ADD CONSTRAINT tarifas_especiales_complejo_id_fkey FOREIGN KEY (complejo_id) REFERENCES public.complejos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict P6F6goq79p5dXfZZxjqqWRG6Xlzb07tE5FQfRvNhBDgLtJlvL4gcJGQl6pcaK9S

