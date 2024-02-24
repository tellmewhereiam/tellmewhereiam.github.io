let latitude = null,
    longitude = null,
    apiGoogleMunicipio = null,
    apiGoogleProvincia = null,
    provinceText = null,
    municipalityText = null

$(document).ready(() => {
    function esDispositivoMovil() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        )
    }

    if (esDispositivoMovil()) {
        console.log('El usuario está usando un dispositivo móvil')
    } else {
        showNoMobileAlert()
        console.log('El usuario no está usando un dispositivo móvil')
    }

    $.getJSON('https://rymultiservicios.com/api/provincias').done((data) => {
        let options = [
            '<option value="" disabled selected>Selecciona una provincia</option>',
        ]
        data.map(({ id, nombre }) => {
            options.push(`<option value=${id}>${nombre}</option>`)
        })
        $('#provincia-select').append(options).select2({
            theme: 'bootstrap',
            allowClear: true,
            language: 'es',
            placeholder: 'Selecciona una provincia',
        })

        $('#municipio-select').select2({
            theme: 'bootstrap',
        })
    })

    getLocation()
})

$(() => {
    $('#provincia-select').on('select2:select', (e) => {
        const idProvincia = e.params.data.id
        provinceText = e.params.data.text
        municipalityText = null

        const settings = {
            url: 'https://rymultiservicios.com/api/search/municipio',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                idProvincia: parseInt(idProvincia),
            }),
        }

        $.ajax(settings).done((data) => {
            let options = [
                '<option value="" disabled selected>Selecciona un municipio</option>',
            ]
            data.map(({ id, nombre }) => {
                options.push(`<option value=${id}>${nombre}</option>`)
            })
            $('#municipio-select')
                .select2('destroy')
                .empty()
                .select2({
                    theme: 'bootstrap',
                    allowClear: true,
                    language: 'es',
                    placeholder: 'Seleccione un municipio',
                })
                .removeAttr('disabled')
                .append(options)
        })
    })

    $('#municipio-select').on('select2:select', (e) => {
        municipalityText = e.params.data.text
    })

    $('form#dest-data-form').on('submit', (event) => {
        event.preventDefault()
        if (!latitude || !longitude) {
            showAlert()
        } else {
            let jsonData = {}
            $('form#dest-data-form')
                .serializeArray()
                .map(({ name, value }) => {
                    jsonData[name] =
                        name === 'provincia'
                            ? `/api/provincias/${value}`
                            : name === 'municipio'
                            ? `/api/municipios/${value}`
                            : value
                })
            jsonData['latitud'] = latitude.toString()
            jsonData['longitud'] = longitude.toString()

            let sended = false
            if (apiGoogleMunicipio && apiGoogleProvincia) {
                if (
                    cleanString(provinceText).trim().toLowerCase() ===
                    cleanString(apiGoogleProvincia).trim().toLowerCase()
                ) {
                    if (
                        !cleanString(municipalityText)
                            .trim()
                            .toLowerCase()
                            .includes('isla')
                    ) {
                        if (
                            cleanString(municipalityText)
                                .trim()
                                .toLowerCase() ===
                            cleanString(apiGoogleMunicipio).trim().toLowerCase()
                        ) {
                            sended = true
                            submitForm(jsonData)
                        }
                    } else {
                        sended = true
                        submitForm(jsonData)
                    }
                }
            } else {
                sended = true
                submitForm(jsonData)
            }
            if (!sended) $('#noEqualData').removeAttr('style')
        }
    })

    $('.noCoorsBtn').on('click', () => {
        getLocation()
        hideAlert()
    })
})

const submitForm = (jsonData) => {
    const settings = {
        url: 'https://rymultiservicios.com/api/destinatarios',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(jsonData),
    }

    $.ajax(settings)
        .done(function () {
            bootbox.alert({
                size: 'small',
                title: 'Información',
                message:
                    'Sus datos han sido guardados satisfactoriamente. Gracias.',
                callback: function () {
                    location.reload()
                },
            })
        })
        .fail((error) => {
            const errorJSON = JSON.parse(error.responseText)
            console.log(errorJSON.detail)
            bootbox.alert({
                size: 'small',
                title: 'Error',
                message: `<div class='text-danger'>${errorJSON.detail}</div>`,
            })
        })
}

const getLocation = () => {
    if ('geolocation' in navigator) {
        console.log('Iniciando obtención de coordenadas...')
        navigator.geolocation.getCurrentPosition(
            (position) => {
                $('#user-latlng').children().remove()
                $('#user-latlng')
                    .append(`<div id='details-user-latlng' class='mt-3'>
                    <span>Latitud: ${position.coords.latitude}</span><br/>
                    <span>Longitud: ${position.coords.longitude}</span>
                </div>`)

                console.log(
                    'Latitud: ' +
                        position.coords.latitude +
                        ', Longitude: ' +
                        position.coords.longitude
                )

                latitude = position.coords.latitude
                longitude = position.coords.longitude

                $.getJSON(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyDIuBvChNdRHaY3pxTEcwwDQM_98pPK4-g`
                ).done((data) => {
                    if (data.status === 'OK') {
                        const info = data.results[0]

                        info.address_components.map((elm) => {
                            if (
                                elm.types.includes(
                                    'administrative_area_level_1'
                                )
                            ) {
                                apiGoogleProvincia = elm.long_name
                            }
                            if (
                                elm.types.includes(
                                    'administrative_area_level_2'
                                )
                            ) {
                                apiGoogleMunicipio = elm.long_name
                            }
                        })

                        console.log(
                            `${apiGoogleMunicipio}, ${apiGoogleProvincia}`
                        )
                    }
                })
            },
            (error) => {
                console.error(
                    'Error al obtener las coordenadas: ' + error.message
                )
                showAlert(error.message)
            }
        )
    } else {
        console.error('El navegador no soporta geolocalización')
    }
}

const showAlert = (error = null) => {
    if (error) {
        $('#emptyLatLong').find('#details').remove()
        $('#emptyLatLong').append(
            `<div id="details"><br/>Detalles del error: <b>${error}</b></div>`
        )
    }
    $('#emptyLatLong').addClass('show')
}

const hideAlert = () => {
    $('#emptyLatLong').removeClass('show')
    $('#noEqualData').attr('style', 'display:none')
}

const showNoMobileAlert = () => {
    $('#noMobileDevice').attr('style', 'display:block')
}

const cleanString = (item) =>
    item
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ü/g, 'u')
        .replace(/ñ/g, 'n')
