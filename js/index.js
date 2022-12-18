/*
    @autor: Chema SM
    @version: 1.0.0
    @description: Tareas
    @url: https://github.com/ChemaSanchez11/Proyecto_ToDo
*/

//Botones
const $btnNewTask = document.querySelector('#new_task');
const $btnIndex = document.querySelector('#back_index');

//Elementos DIV
const $divNewTask = document.querySelector('#content_new_task');
const $divIndex = document.querySelector('#index');

//Form
const $form = document.querySelector('#create_task');

//Funcion que carga el HTML y sus funciones de las tasks
init();

async function init() {
    const tasks = await loadTasks();
    let [pendingTasks, finishTasks, deleteTasks] = tasks;

    //Actualizamos los contadores de finalizadas, pendientes y eliminadas
    document.querySelector('#pending').textContent = pendingTasks;
    document.querySelector('#finish').textContent = finishTasks;
    document.querySelector('#delete').textContent = deleteTasks;


    //Cargamos el grafico
    const ctx = document.getElementById('grafico');

    let myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendientes', 'Terminadas', 'Eliminadas'],
            datasets: [{
                label: '',
                data: [pendingTasks, finishTasks, deleteTasks],
                borderWidth: 1,
                backgroundColor: ['#F1C40F', '#27AE60', '#CB4335'],
            }]
        }
    });

    //Herramientas de las tareas (FINALIZAR, EDITAR, BORRAR)
    toolsTasks();


    //Buscar una tarea
    const $search = document.querySelector('#search');
    $search.addEventListener('keyup', async function (event) {
        let valor = event.target.value;
        const res = await fetch("http://localhost:8080/tareas"), tasks = await res.json();

        if(!tasks) return false;


        // const tasks = JSON.parse(localStorage.getItem('tasks'));
        const $tasks = document.querySelector('#tasks');

        //TEMPLATES
        const $template = document.querySelector(".template-card").content;
        let $fragment = new DocumentFragment();

        tasks.forEach(task => {
            let name = task.name;

            //comprueba que el nombre contenga ese valor
            if (name.includes(valor)) {

                //Borra todas las tareas del HTML
                while ($tasks.firstChild) {
                    $tasks.removeChild($tasks.lastChild);
                }

                let $clonado = document.importNode($template, true);

                let $card = $clonado.querySelector('.card');

                if (!task.status) {
                    $card.classList.add('text-success');
                    pendingTasks++;
                } else {
                    $card.classList.add('text-primary', 'text-finish');
                    finishTasks++;
                    $card.querySelector('.finish-task').classList.remove('btn-success');
                    $card.querySelector('.finish-task').classList.add('btn-secondary', 'disabled');
                }

                $clonado.querySelector('.delete-task').dataset.id = task.id;
                $clonado.querySelector('.edit-task').dataset.id = task.id;
                $clonado.querySelector('.finish-task').dataset.id = task.id;

                $clonado.querySelector('.card-title').textContent = task.name;
                $clonado.querySelector('.task-type').textContent = `Tipo: ${task.type}`;
                $clonado.querySelector('.date-created').textContent = `Creado: ${task.timecreate}`;
                $clonado.querySelector('.date-finish').textContent = `Fin: ${task.timefinish}`;

                //Clonar el template
                $fragment.appendChild($clonado);
            }
        });

        $tasks.append($fragment);

        //Carga las herramientas
        toolsTasks();

    });

}

//Mostramos el formulario de creacion de tarea

$btnNewTask.addEventListener('click', (event) => {
    event.preventDefault();

    showHTML('new-task');

});

//Creacion de la nueva tarea
$form.addEventListener('submit', async (event) => {
    event.preventDefault();

    //Recojo los datos con formData
    const formData = new FormData($form);

    const status = verifyForm(formData);

    if (!status) return;

    let date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    let dateCreated = `${day}/${month}/${year}`;

    date = new Date(formData.get('task_finish'));

    day = date.getDate();
    month = date.getMonth() + 1;
    year = date.getFullYear();

    let dateFinish = `${day}/${month}/${year}`;

    let newTask = {
        name: formData.get('name_task'),
        type: formData.get('type_task'),
        timecreate: dateCreated,
        timefinish: dateFinish,
        status: 0,
    }

    //Se almacenan en el JSON-Server
    try {
        const options = {
            method: "POST", headers: {
                "Content-Type": "application/json; charset=utf-8",
            }, body: JSON.stringify(newTask),
        };

        const res = await fetch("http://localhost:8080/tareas", options), json = await res.json();


        if (res.ok) console.log(res.status); else throw {status: res.status, statusText: res.statusText};

        //Recargamos la pagina
        location.reload();
    } catch (exception) {
        console.log(exception.statusText);
    }



});

//Mostramos el indice
$btnIndex.addEventListener('click', (event) => {
    event.preventDefault();

    showHTML('show-index');

});

function showHTML(action) {

    //Si es show-index mostramos las tareas
    if (action === 'show-index') {

        $btnIndex.style.display = 'none';
        $btnNewTask.style.display = 'initial';

        $divNewTask.style.display = 'none';
        $divIndex.style.display = 'block';

    } else if (action === 'new-task') {

        $btnNewTask.style.display = 'none';
        $btnIndex.style.display = 'initial';

        $divIndex.style.display = 'none';
        $divNewTask.style.display = 'block';

    } else {
        console.error('No he podido interpretar la accion ' + action);
    }
}

/**
 * Comprueba el formulario y añade elementos en el html si no es correcto
 * @return boolean
 */

function verifyForm(formData) {

    let valid = true;

    document.querySelectorAll('.valid-feedback').forEach(($element) => {
        $element.style.display = 'none';
    });

    for (const [key, value] of formData) {
        if (!value.length) {

            valid = false;

            let $element = document.querySelector(`#${key}_feedback`);
            $element.style.color = 'red';
            $element.textContent = 'No puede estar vacio';
            $element.style.display = 'block';
        }
    }

    return valid;
}

/**
 * Carga todas las tareas las pinta en el html y devuelves los datos
 * @return array
 */
async function loadTasks() {

    let pendingTasks = 0, finishTasks = 0, deleteTasks = 0;

    const res = await fetch("http://localhost:8080/tareas"), tasks = await res.json();


    // const tasks = JSON.parse(localStorage.getItem('tasks'));
    const $tasks = document.querySelector('#tasks');

    //TEMPLATES
    const $template = document.querySelector(".template-card").content;
    let $fragment = new DocumentFragment();

    tasks.forEach(task => {
        let $clonado = document.importNode($template, true);

        let $card = $clonado.querySelector('.card');

        if (!task.status) {
            $card.classList.add('text-success');
            pendingTasks++;
        } else {
            $card.classList.add('text-primary', 'text-finish');
            finishTasks++;
            $card.querySelector('.finish-task').classList.remove('btn-success');
            $card.querySelector('.finish-task').classList.add('btn-secondary', 'disabled');
        }

        //Seteamos las data-id
        $clonado.querySelector('.delete-task').dataset.id = task.id;
        $clonado.querySelector('.edit-task').dataset.id = task.id;
        $clonado.querySelector('.finish-task').dataset.id = task.id;

        //Ponemos los valores
        $clonado.querySelector('.card-title').textContent = task.name;
        $clonado.querySelector('.task-type').textContent = `Tipo: ${task.type}`;
        $clonado.querySelector('.date-created').textContent = `Creado: ${task.timecreate}`;
        $clonado.querySelector('.date-finish').textContent = `Fin: ${task.timefinish}`;

        //Clonar el template
        $fragment.appendChild($clonado);
    });

    $tasks.append($fragment);

    //Obtenemos el contador de eliminadas
    if (localStorage.getItem("tasks") !== null) {
        let tasks = JSON.parse(localStorage.getItem("tasks"));
        deleteTasks = tasks.length;
    }

    return [pendingTasks, finishTasks, deleteTasks];

}

/**
 * Obtiene la tarea de la ID seleccionada
 * @param int
 * @return object
 */
async function getTaskById(id) {
    return await fetch("http://localhost:8080/tareas/" + id)
        .then((response) => {
            return response.json();
        }).then((data) => {
            return data;
        })
        .catch((e) => {
            //Aqui devuelve error
            console.log(e);
            return false;
        });
}

//Finalizar la tarea
async function finishTask(event) {
    event.preventDefault();
    let taskId = event.target.dataset.id;
    let task = await getTaskById(taskId);

    try {
        const options = {
            method: "PUT", headers: {
                "Content-Type": "application/json",
            }, body: JSON.stringify({
                name: task.name,
                type: task.type,
                timecreate: task.timecreate,
                timefinish: task.timefinish,
                status: 1,
            }),
        };
        const url = "http://localhost:8080/tareas/" + taskId;
        let res = await fetch(url, options);
        const json = await res.json();

        if (!res.ok) throw {status: res.status, message: res.statusText};
        //recargamos la pagina una vez que la petición post ha sido OK.
        location.reload();
    } catch (error) {
        console.log(error);
    }

}

async function editTask(event) {
    event.preventDefault();
    let taskId = event.target.dataset.id;
    let task = await getTaskById(taskId);

    let $card = event.target.offsetParent;
    let $form = $card.querySelector('#edit-task');
    $form.style.display = 'block';
    $form.querySelector('#edit_name_task').value = task.name;
    $form.querySelector('#edit_type_task').value = task.type;

    $form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData($form);

        const status = verifyForm(formData);

        console.log(status);

        try {
            const options = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.get('name_task'),
                    type: formData.get('type_task'),
                    timecreate: task.timecreate,
                    timefinish: task.timefinish,
                    status: task.status,
                }),
            };
            const url = "http://localhost:8080/tareas/" + taskId;
            let res = await fetch(url, options);
            const json = await res.json();

            if (!res.ok) throw {status: res.status, message: res.statusText};
            //recargamos la pagina una vez que la petición post ha sido OK.
            location.reload();
        } catch (error) {
            console.log(error);
        }

    });

}

async function deleteTask(event) {
    event.preventDefault();

    let taskId = event.target.dataset.id;

    let data = getTaskById(taskId);

    if (localStorage.getItem("tasks") === null) {
        localStorage.setItem('tasks', JSON.stringify([data]));
    } else {
        let tasks = JSON.parse(localStorage.getItem("tasks"));
        tasks.push(data);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    //Eliminar
    try {
        const options = {
            method: "DELETE", headers: {
                "Content-Type": "application/json; charset=utf-8",
            }
        };

        //Formamos la url con offsetParent por que es donde tenemos el data-id
        const url = "http://localhost:8080/tareas/" + taskId;

        let res = await fetch(url, options);

        const json = await res.json();
        if (!res.ok) throw {status: res.status, message: res.statusText};

        //recargamos la pagina una vez que la petición post ha sido OK.
        location.reload();
    } catch (error) {
        console.log(error.statusText);
    }
}

function toolsTasks(){
    document.querySelectorAll('.finish-task').forEach(element => {
        element.addEventListener('click', (e) => finishTask(e));
    });

    document.querySelectorAll('.edit-task').forEach(element => {
        element.addEventListener('click', (e) => editTask(e));
    });

    document.querySelectorAll('.delete-task').forEach(element => {
        element.addEventListener('click', (e) => deleteTask(e));
    });
}