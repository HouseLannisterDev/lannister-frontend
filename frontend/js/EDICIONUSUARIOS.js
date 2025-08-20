document.addEventListener("DOMContentLoaded", () => {
    const usuariosList = document.getElementById("usuarios-list");
    const paginacion = document.getElementById("paginacion");

    const modalInicio = document.querySelector('.sesion-modal');

    let usuarios = [];
    let paginaActual = 1;
    const usuariosPorPagina = 5;

    async function cargarUsuarios() {
        try {
            const res = await fetch('/api/usuarios?_=' + new Date().getTime());
            
            if (!res.ok) throw new Error("Error HTTP: " + res.status);

            usuarios = await res.json();

        
            mostrarPagina(paginaActual);
            crearBotonesPaginacion();
            
        } catch (err) {
            showNotificationPanel('Error al traer usuarios', 'error', modalInicio);
        }
    }

    function mostrarPagina(pagina) {
        usuariosList.innerHTML = "";
        const inicio = (pagina - 1) * usuariosPorPagina;
        const fin = inicio + usuariosPorPagina;
        const usuariosPagina = usuarios.slice(inicio, fin);

        usuariosPagina.forEach(u => {
            const div = document.createElement("div");
            div.classList.add("usuario-item");
            div.style.display = "flex";
            div.style.alignItems = "center";
            div.style.marginBottom = "14px";
            div.style.justifyContent = "space-between";

            div.innerHTML = `

                <div style="flex: 1">
                    <strong>${u.usuario}</strong><br>
                    ${u.email}<br>
                    ${u.nombre} ${u.apellido}<br>
                    Tel: ${u.telefono}
                </div>

                <div style="display: flex; gap: 12px;">



                    <img src="assets/editLogo.png" alt="Editar" width="30" height="30" style="cursor: pointer;">
                    <img src="assets/deleteLogo.png" alt="Eliminar" width="25" height="25" style="cursor: pointer;" class="btn-eliminar" data-usuario="${u.usuario}">
                </div>
            `;
            usuariosList.appendChild(div);
        });
        

        //CÓDIGO PARA QUE SALGA LA FOTO DE PERFIL DE USUARIO SI SE DESEA DEBAJO DE DIV STYLE DISPLAY
        //                    <img src="/fotos/${u.foto}" 
        //            alt="Foto de ${u.usuario}" 
        //            width="40" height="40" 
        //            style="border-radius: 50%; cursor: pointer;"
        //            class="foto-perfil"></img>

        document.querySelectorAll(".foto-perfil").forEach(img => {

            img.addEventListener("click" , () => {
                window.open(img.src, "_blank");
            });

        });


        document.querySelectorAll(".usuario-item").forEach(div => {

            const usuarioId = div.querySelector('.btn-eliminar').getAttribute('data-usuario');

            div.querySelector('img[alt="Editar"]').addEventListener('click', () => {
                mostrarFormularioEdicion(div, usuarios.find(u => u.usuario === usuarioId));
            });

        });


        //en script notifierPanelUSer parte de abajo metodo showCOnfirmationPanel
        //select para eliminar

        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", () => {
                const usuarioEliminar = btn.getAttribute("data-usuario");
                const modal = document.getElementById('modalConfirm'); // Un div en tu HTML

                showConfirmationPanel(`¿Seguro que quieres eliminar al usuario ${usuarioEliminar}?`, modal,
                    async () => {

            // Confirmar eliminación

            try {
                const res = await fetch(`/api/usuarios/${usuarioEliminar}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Error al eliminar usuario");
                cargarUsuarios();
                showNotificationPanel(`Usuario ${usuarioEliminar} eliminado`, 'success', modal);
            } catch (err) {
                console.error(err);
                showNotificationPanel("No se pudo eliminar el usuario", 'error', modal);
            }
        },() => {
            // Cancelar, no hacer nada o mostrar mensaje
            showNotificationPanel("Eliminación cancelada", 'info', modal);});
        
        });
        
        });



        //EDITAR USUARIO

        function mostrarFormularioEdicion(divUsuario, usuario){

            //Evitar la creación de otros formularios
            if(divUsuario.querySelector('.form-edicion')) return;

            const form = document.createElement('form');

            form.classList.add('form-edicion');
            form.style.marginTop = '10px';
            form.innerHTML = `

            <input type="email" name="email" value="${usuario.email}" placeholder="Email" required style="margin-right: 5px;">
            <input type="text" name="nombre" value="${usuario.nombre}" placeholder="Nombre" required style="margin-right: 5px;">
            <input type="text" name="apellido" value="${usuario.apellido}" placeholder="Apellido" required style="margin-right: 5px;">
            <input type="tel" name="telefono" value="${usuario.telefono}" placeholder="Teléfono" required style="margin-right: 5px;">

            <button type="submit">Guardar</button>
            <button type="button" id="cancelarEdicion">Cancelar</button>

            `;

            divUsuario.appendChild(form);

            //cancelar edición
            form.querySelector('#cancelarEdicion').onclick = () => {
                form.remove();
            };

            form.onsubmit = async (e) => {

                e.preventDefault();

                const formData = new FormData(form);

                const datosActualizados = {

                    email: formData.get('email'),
                    nombre: formData.get('nombre'),
                    apellido: formData.get('apellido'),
                    telefono: formData.get('telefono')

                };

                try{

                    const res = await fetch(`/api/usuarios/${usuario.usuario}`, {

                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosActualizados)

                    });

                    if (!res.ok) throw new Error('Error actualizando usuario');

                    showNotificationPanel('Usuario actualizado correctamente', 'success', modalInicio);
                    form.remove();
                    mostrarPagina(paginaActual);

                }catch(err){
                    showNotificationPanel('Error al actualizar el usuario',modalInicio);
                }

            };

        }


    }





    function crearBotonesPaginacion() {
        paginacion.innerHTML = "";
        const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);

        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement("button");
            btn.innerText = i;
            btn.style.margin = "0 5px";
            btn.onclick = () => {
                paginaActual = i;
                mostrarPagina(paginaActual);
                cargarUsuarios();
            };
            paginacion.appendChild(btn);
        }
    }

    // Llamar automáticamente al cargar la página
    cargarUsuarios();
});
