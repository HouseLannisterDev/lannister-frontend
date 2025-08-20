document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('guardarPQRSF').addEventListener('click', async () => {

        const entrada = document.getElementById('entrada').value.trim();
        const salida = document.getElementById('salida').value.trim();

        const modalInicio = document.querySelector('.sesion-modal');

        if(!entrada || !salida){
            showNotificationPanel('Por favor, complete los campos', 'error', modalInicio);
            return;
        }

        const nuevoDato = {entrada, salida};

        try{

            const response = await fetch('/pqrsf' ,{

                method: 'POST',
                headers: { 'Content-type': 'application/json'},
                body: JSON.stringify(nuevoDato)

            });

            if(response.ok){

                showNotificationPanel('PQRSF guardado con éxito', 'success', modalInicio);

                document.getElementById('pqrsfForm').reset();
            }else{
                showNotificationPanel('Error al guardar', 'error', modalInicio);
            }

        }catch(error){

            showNotificationPanel('Error al conectar con el servidor', 'error', modalInicio);
        }


    });

});