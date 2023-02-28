const $form = document.querySelector('#form');
const $textarea = document.querySelector('#tak-description');
const $list = document.querySelector('#list');
const $listContent = document.querySelector('#list-content');
const $saveBTN = document.querySelector('#send-tak-btn');
const $alertMessage = document.getElementById('alert-message');
const $shadow = document.getElementById('shadow');
const $shadowInvisible = document.getElementById("shadow-invisible");
const END_POINT =
  'https://script.google.com/macros/s/AKfycbyUoMeRfeYzFhJCA4Sfe9EWFo6qnWezRXt_ocKpwmPJmf5aJEYupKNwmyNNN_CzKgV2/exec';

//Funciones

(function ocultar() {
  if (localStorage['form-hidden']) {
    $form.hidden = JSON.parse(localStorage['form-hidden']);
  }

  //cargando lista
  $alertMessage.innerText = 'Cargando';
  messageToggle(false);
  getSheetData(END_POINT, 'lista', 'tareasCargadas', (list) => {
    renderList(list);
    messageToggle(true);
  });
})();

//getSheetData(END_POINT,"lista","dta",(res)=>{console.log(res)})

//ocultar y desocultar shadow

function messageToggle(oculto) {
  $shadow.hidden = oculto;
  $shadowInvisible.hidden = oculto;
}

function saveOrUpdateTak() {
  if (sessionStorage.getItem('id-u')) {
    updateTak(sessionStorage.getItem('id-u'));
    return;
  }

  saveTak();
}

function saveTak() {
  //message
  $alertMessage.innerText = 'Guardando';
  messageToggle(false);

  var tarea = $textarea.value;
  var id = generateUUID();
  sessionStorage.setItem('saved-id', id);
  var modificado = Date.now();
  var object = { tarea, id, modificado };
  insertRows(END_POINT, 'lista', [object], null, (list) => {
    renderList(list);
    var id = sessionStorage.getItem('saved-id');
    var saved = document.getElementById(id);
    saved.scrollIntoView();
    saved.classList.add('btn-info');
    setTimeout(() => {
      saved.classList.remove('btn-info');
    }, 2500);
    messageToggle(true);
  });
}

function updateTak() {
  //mensage
  $alertMessage.innerText = 'Actualizando';
  messageToggle(false);

  var id = sessionStorage.getItem('id-u');
  var tarea = $textarea.value;
  var object = { tarea, id };
  updateRows(END_POINT, 'lista', [object], 'id', null, (list) => {
    renderList(list);
    cancelEdit();
    var edited = document.getElementById(id);
    edited.scrollIntoView();
    edited.classList.add('btn-secondary');
    setTimeout(() => {
      edited.classList.remove('btn-secondary');
    }, 2500);
    messageToggle(true);
  });
}

function actualizar(e) {
  var tag = e.target;
  if (document.querySelector('div.bg-info.tak')) {
    document.querySelector('div.bg-info.tak').classList.remove('bg-info');
  }
  tag.classList.add('bg-info');
  sessionStorage.setItem('id-u', tag.id);
  $textarea.value = tag.innerText;
  $saveBTN.innerText = 'Actualizar';
  $form.scrollIntoView();
  $textarea.focus();

  //agregar btn para cancelar ediccion
  if(document.querySelector("#cancel-edit")){document.querySelector("#cancel-edit").outerHTML=""};
  var btnCancelEdit = document.createElement('button');
  $saveBTN.parentElement.appendChild(btnCancelEdit);
  btnCancelEdit.outerHTML = `<button
  type="submit"
  id="cancel-edit"
  onclick="javascript: cancelEdit();"
  class="btn btn-danger"
>
  Cancelar
</button>`;
}

function cancelEdit() {
  $textarea.value = '';
  $saveBTN.innerText = 'Guardar Tarea';
  if (document.querySelector('div.bg-info.tak')) {
    document.querySelector('div.bg-info.tak').classList.remove('bg-info');
  }
  document.getElementById(sessionStorage.getItem('id-u')).scrollIntoView();
  sessionStorage.removeItem('id-u');
  document.getElementById('cancel-edit').outerHTML = '';
}

function renderList(list) {
  //Borrar Lista
  $listContent.innerHTML = '';
  var takDivClasses = '';
  //estilo borde
  takDivClasses += 'border border-danger';
  //numero de columnas
  takDivClasses += ' col-11';
  takDivClasses += ' tak';

  //reorganizando lista:
  var RankedList = list.sort(function (a, b) {
    return b.modificado - a.modificado;
  });

  for (object of RankedList) {
    var div = document.createElement('div');
    $listContent.appendChild(div);
    div.outerHTML = `
    <div class="row">
    <div id="${object.id}" ondblclick="javascript: actualizar(event);" class="${takDivClasses}">${object.tarea}</div>
    <!--Estilos para x de borrar-->
    <div data-id="${object.id}" class="col-1 btn-danger" style="cursor:pointer; text-align:center" onclick="javascript: deleteTak(event);">X</div>

    <div>
    `;
    div = document.getElementById(object.id);
    // console.log()
    div.innerText = object.tarea;
  }
}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

function deleteTak(e) {
  $alertMessage.innerText = 'Eliminando';
  messageToggle(false);
  deleteRows(
    END_POINT,
    'lista',
    [{ id: e.target.dataset.id }],
    'id',
    null,
    (list) => {
      renderList(list);
      messageToggle(true);
    }
  );
}

function closeWindowADDTak() {
  $form.hidden = !$form.hidden;
  localStorage.setItem('form-hidden', $form.hidden);
}

//ocultar();

//SUBIR ARCHIVOS

async function uploadFiles(e) {
  e.preventDefault();
  const filesInput = document.querySelector('#files-loaded');
  var takDescription = document.querySelector('#tak-description');
  if (filesInput.files.length > 0) {
    for (file of filesInput.files) {
      var base64 = await fileToBase64(file)
        .then((base64String) => {
          return base64String;
        })
        .catch((error) => {
          return error;
        });
      if (!(typeof base64 == 'string')) {
        console.error(
          'ocurrio un error con el base64 del archivo ' +
            file.name +
            ': ' +
            base64
        );
        console.log('se detuvo la funcion');
        return;
      }

      var payload = {
        archivo_name: file.name,
        file_mime: file.type,
        archivo_base64: base64,
      };

      var result = await fetch(
        'https://script.google.com/macros/s/AKfycbz9GV4R7FOQOoTukIl8RDmdqw_sOy00z8H1IJDgA8dCQIMCbxO031VFF4TbwjSqBf0PIg/exec',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
        .then((res) => res.json())
        .then((res) => res);

      if (result.status == 'error') {
        console.error('ocurrio con la respuesta del servidor de appscript: ');
        console.log(result);
        console.log('se detuvo la funcion');
        return;
      }

      if (takDescription[takDescription.length - 1] === '\n') {
        takDescription.value =
          takDescription.value +
          '"' +
          file.name +
          '"' +
          ': https://drive.google.com/uc?id=' +
          result.fileId;
      } else {
        takDescription.value =
          takDescription.value +
          '\n' +
          '"' +
          file.name +
          '"' +
          ': https://drive.google.com/uc?id=' +
          result.fileId;
      }
    }
  } else {
    alert(filesInput.files.length + ' archivos cargados.');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsDataURL(file);
  });
}
