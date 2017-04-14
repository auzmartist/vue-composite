(function(){
	return {
		name: 'pl-profile-menu',
		data() {
			return {
				clickCounter: 0,
				menuLinks: [
					{name: 'Profile', url: '#'},
					{name: 'Shipping', url: '#'},
					{name: 'Billing', url: '#'},
					{name: 'Settings', url: '#'},
				]
			};
		},
		created: function() {
			let vm = this;
			vm.$on('linkClicked', function() {
				vm.clickCounter++;
				alert('!');
			});
			setInterval(function() {
				vm.$store.commit('incCounter');
			}, 500);
		},
		methods: {
			emitClickedLink: function() {
				this.$emit('linkClicked');
			},
		},
		template: `
			<nav class="pl-profile-menu">{{clickCounter}}<ul>
				<li class="menu-item" v-for="l in menuLinks"><a v-on:click="emitClickedLink()" :href="l.url">{{l.name}}</a></li>
			</ul></nav>
		`,
		_injectCss: `
			.pl-profile-menu ul {
				
				list-style-type: none;
			}
			.pl-profile-menu ul li {
				display: block;
				margin: 0;
				padding: 8px;
				border-bottom: 1px solid #eee;
			}
			.pl-profile-menu a {
				color: #55bbff;
				text-decoration: none;
			}
		`,
	};
})();
