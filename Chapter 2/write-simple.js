'use strict'

const fs = require('fs')
fs.writeFile('target.txt', "hello world" ,(err) => {
	return (err) ? err : console.log('File Saved!') 
})