export function Saludo() {
    return (
        <>
            <h1>Saludo</h1>
            
            <label
                htmlFor="saludo-input"
            >
                Nombre:
            </label>
            <input
                id="saludo-input"
                placeholder="Ingrese su nombre aqui"
            >
            </input>
        </>
    );
}