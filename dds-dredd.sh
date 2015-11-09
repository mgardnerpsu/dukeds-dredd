#!/bin/bash

# activate the python virtual environment
# export PYTHON_VIRTUAL_ENV=${HOME}/pyenvs/dredd-test
# source ${PYTHON_VIRTUAL_ENV}/bin/activate

# set the API blueprint file location
export BLUEPRINT=../duke-data-service/apiary.apib 
# set the live API root endpoint
export ENDPOINT=https://dukeds-dev.herokuapp.com/api/v1

# export APIARY_API_KEY=939d014cfd1e27819172a03810134ce9
# export APIARY_API_NAME=dukedataservices

dredd ${BLUEPRINT} ${ENDPOINT} \
--names
# --only "Projects > Projects collection > Create project" \
# --only "Projects > Projects collection > List projects" \
# --only "Projects > Project instance > View project" \
# --hookfiles "*hooks.js" \
# --reporter "apiary" \
# --header "Accept: application/json" \
# --header "Authorization: " 
