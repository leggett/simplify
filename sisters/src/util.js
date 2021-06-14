export function getProperty(props, name) {
	return props.find(({ name: check }) => check === name)?.value;
}
