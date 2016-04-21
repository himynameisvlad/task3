/* Application */


//Добавил функцию очистки инпутов формы
function clearFormInputs(form) {
    var $form = document.getElementsByClassName(form)[0];
    [].forEach.call(
            $form.querySelectorAll('input, textarea'),
            (x) => {
                x.value = ''
                x.removeAttribute('disabled');
            }
        );
        $form.querySelectorAll('button')[0].removeAttribute('disabled');
}


function renderAddedStudent(student) {

    if (!student) return;
    [].forEach.call(
        document.querySelectorAll('.students__list'),
        (container) => {
            container.innerHTML += renderStudent(JSON.parse(student));
        }
    );
}

function addToCache( student ) {

    var studentStr = student;

    var nextStudentId = document.getElementsByClassName('student').length + 1;
    var studentJson = JSON.parse(student);
    studentJson = Object.assign({}, studentJson, {id: nextStudentId});
    studentStr = JSON.stringify(studentJson);

    if(!localStorage['students']) {

        localStorage.setItem('students', `[${studentStr}]`);

        renderAddedStudent(studentStr);

        clearFormInputs('students__add-form');

    }else{

        var cachedData = JSON.parse(localStorage['students']);
        cachedData.push(studentJson);

        localStorage['students'] = JSON.stringify(cachedData);

        renderAddedStudent(studentStr);

        clearFormInputs('students__add-form');

    }
}

function getFormData(form) {
    return [].reduce.call(
        form.querySelectorAll('input, textarea'),
        (result, formElement) => {
            result[formElement.name] = formElement.value;
            return result;
        }, {}
    );
}

function updateStudentsList(studentsData) {

    const studentsHTML = studentsData.map(renderStudent).join('');

    [].forEach.call(
        document.querySelectorAll('.students__list'),
        (container) => {
            container.innerHTML = studentsHTML;
        }
    );
}

function delegate(containers, selector, event, handler) {
    [].forEach.call(containers, (container) => {
        container.addEventListener(event, function (e) {
            if (e.target.matches(selector)) {
                handler.apply(e.target, arguments);
            }
        });
    });
}

function onStudentAddClick(e) {
    e.preventDefault();

    this.setAttribute('disabled', 'disabled');

    getStudentData(this.closest('form'))
        .then(addStudent)
        .then((student) => {//Вместо обновления полного списка, сделал рендер 1 студента
            [].forEach.call(
                document.querySelectorAll('.students__list'),
                (container) => {
                    container.innerHTML += renderStudent(student);
                }
            );
        })
        .then(() => {
            [].forEach.call(
                this.closest('form').querySelectorAll('input, textarea'),
                (x) => x.value = ''
            );
            this.removeAttribute('disabled');
        });
}

function onStudentUpdateClick(e) {
    const studentContainer = this.closest('.student');
    const studentData = studentContainer.dataset.student;
    console.log('updating ', studentData);
    studentContainer.innerHTML = renderStudentForm(JSON.parse(studentData));
}

function onStudentSaveClick(e) {
    e.preventDefault();

    const studentContainer = this.closest('.student');
    const studentData = getFormData(this.closest('form'));

    this.setAttribute('disabled', 'disabled');

    getStudentData(this.closest('form'))
        .then(updateStudent)
        .then((student) => {
            const newStudentsContainer = document.createElement('div');
            newStudentsContainer.innerHTML = renderStudent(student);
            const newStudentContainer = newStudentsContainer.removeChild(newStudentsContainer.querySelector('.student'));
            const studentsContainer = studentContainer.parentElement;

            studentsContainer.insertBefore(newStudentContainer, studentContainer);
            studentsContainer.removeChild(studentContainer);
        })
        .catch((e) => {
            if (!(e instanceof ValidationError)) {
                console.error(e);
                alert('Что-то пошло не так!');
            }
        })
        .then(() => {
            this.removeAttribute('disabled');
        });
}

function renderStudent(student) {

    var pict = student.picSrc || student.picture; //Добавил для рендера студента, предназначенного для кэширования(чтобы не создавать лишнего св-а picSrc)
    
    return `
        <div class="student" data-student='${JSON.stringify(student)}'>
            <div class="student__picture">
                <img src="${pict}">
            </div>
            <div class="student__info">
                <h2 class="student__name">${student.name}</h2>
                <p class="student__bio">${student.bio}</p>
                <button class="student__update-btn">Изменить</button>
            </div>
        </div>
    `;
}

function renderStudentForm(student) {
    return `
        <form class="student__update-form student-form">
            <input type="hidden" name="id" value="${student.id}">
            <label class="student-form__field student-form__field-name">
                <span class="student-form__field-label">Имя</span><input type="text" name="name" value="${student.name}">
            </label>
            <label class="student-form__field student-form__field-picture">
                <span class="student-form__field-label">URL фотографии</span><input type="text" name="picture" value="${student.picSrc}">
            </label>
            <label class="student-form__field student-form__field-bio">
                <span class="student-form__field-label">Кратко о себе</span><textarea name="bio" rows="5" cols="40">${student.bio}</textarea>
            </label>
            <button class="student__save-btn">Сохранить</button>
        </form>
    `;
}

function getStudentData(form) {
    return new Promise((resolve, reject) => {
        [].forEach.call(form.querySelectorAll('.student-form__field'), (field) => {
            field.classList.remove('student-form__field_error');
        });

        const student = getFormData(form);
        const validationResult = validateStudent(student);

        if (validationResult === true) {
            resolve(student);
        } else {
            form.querySelector('.student-form__field-' + validationResult.prop)
                .classList.add('student-form__field_error');

            reject(validationResult);
        }
    });
}



function validateStudent(student) {
    try {
        validate(student, 'name', 'Не заполнено имя студента');
        validate(student, 'picture', 'Неправильный адрес фотографии студента');
        validate(student, 'bio', 'Не заполнена биография');
    } catch (e) {
        if (e instanceof ValidationError) {
            return e;
        }

        throw e;
    }

    return true;
}

function validate(obj, prop, msg) {
    if (obj.hasOwnProperty(prop) && validators[prop] && !validators[prop](obj[prop], obj)) {
        throw new ValidationError(prop, msg);
    }
}

const validators = {
    name: (value, obj) => {
        return Boolean(value);
    },
    picture: (value, obj) => {
        if (!value) return false;
        if (!/^https?:\/\//.test(value)) return false;
        return true;
    },
    bio: (value, obj) => {
        return Boolean(value);
    }
};

function ValidationError(prop, message) {
  this.name = 'ValidationError';
  this.prop = prop;
  this.message = message || 'Произошла ошибка валидации';
  this.stack = (new Error()).stack;
}
ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.constructor = ValidationError;

/* API accessors */

function json(response) { return response.json(); }
function error(error) { console.log(error); }

function getStudents() {
    return fetch('/api/v1/students').then(json).catch((e) => console.log(e));
}

//Загрузка из кэша. Если в оффлайне, то студенты рендерятся из кэша
function loadStudentsFromCache() {
    if(localStorage.students) {
        return fetch('/api/v1/updatelist', {
            method: 'post',
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            },
            body: localStorage.students
        }).then( res => {
            localStorage.removeItem('students');
        } )
        .catch( e => {
            //Если оффлайн, то рендеряться стуендты из кэша
            var cachedData = JSON.parse(localStorage['students']);

            cachedData.forEach( student => {
                console.log(student);
                renderAddedStudent(JSON.stringify(student));
            })
        })
    }
}



function addStudent(student) {
    return fetch('/api/v1/students', {
        method: 'post',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(student)
    }).then(json).catch(e => { 
        addToCache(JSON.stringify(student));
     });
}

function updateStudent(student) {
    return fetch(`/api/v1/students/${student.id}`, {
        method: 'put',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(student)
    }).then(json).catch(function() {
        return student;
    });
}

/* Init */

document.addEventListener('DOMContentLoaded', (event) => {

    loadStudentsFromCache();

    delegate(
        document.querySelectorAll('.students'),
        '.students__add-btn',
        'click',
        onStudentAddClick
    );

    delegate(
        document.querySelectorAll('.students'),
        '.student__update-btn',
        'click',
        onStudentUpdateClick
    );

    delegate(
        document.querySelectorAll('.students'),
        '.student__save-btn',
        'click',
        onStudentSaveClick
    );

    getStudents().then(updateStudentsList);
});
