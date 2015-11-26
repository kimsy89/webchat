// io.sockets
{
	name: '/',
	server: {
		nsps: {
			'/': [Circular]
		},
		_path: '/socket.io',
		_serveClient: true,
		_adapter: [function: Adapter],
		_origins: '*:*',
		sockets: [Circular],
		eio: {
			clients: [Object],
			clientsCount: 1,
			pingTimeout: 60000,
			pintInterval: 25000
			upgradeTimeout: 10000,
			maxHttpBufferSize: 100000000,
			transports: [Object],
			allowUpgrades: true,
			allowRequest: [Function],
			cookie: 'io',
			ws: [Object],
			_events: [Object]
		},
		httpServer: {
			domain: null,
			_events: [Object],
			_maxListeners: 10,
			_connections: 5,
			connections: [Getter/Setter],
			_handle: [Object],
			_usingSlaves: false,
			_slaves: [],
			allowHalfOpen: true,
			httpAllowHalfOpen: false,
			timeout: 120000,
			_connectionKey: '4:0.0.0.0:3200'
		},
		engine: {
			clients: [Object],
			clientsCount: 1,
			pingTimeout: 60000,
			pingInterval: 25000,
			upgradeTimeout: 10000,
			maxHttpBufferSize: 100000000,
			transports: [Object],
			allowUpgrades: true,
			allowRequest: [Function],
			cookie: 'io',
			ws: [Object],
			_events: [Object]
		}
	},
	sockets: [
		{
			nsp: [Circular],
			server: [Object],
			adapter: [Object],
			id: 'tolhqoIooMAnoMeQAAAA',
			client: [Object],
			conn: [Object],
			rooms: [],
			acks: {},
			connected: true,
			disconnected: false,
			handshake: [Object]
		}
	],
	connected: {
		tolhqoIooMAnoMeQAAAA: {
			nsp: [Circular],
			server: [Object],
			adapter: [Object],
			id: 'tolhqoIooMAnoMeQAAAA',
			client: [Object],
			conn: [Object],
			rooms: [],
			acks: {},
			connected: true,
			disconnected: false,
			handshake: [Object]	
		}
	},
	fns: [],
	ids: 0,
	acks: {},
	adapter: {
		nsp: [Circular],
		rooms: {
			tolhqoIooMAnoMeQAAAA: [Object]
		},
		sids: {
			tolhqoIooMAnoMeQAAAA: [Object]
		},
		encoder: {}
	},
	_events : {
		connection: [Function]
	}
}