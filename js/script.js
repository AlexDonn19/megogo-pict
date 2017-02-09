"use strict";

document.addEventListener('DOMContentLoaded', (function () {
   
    var imageUrlArr = [],
        loadArrStatus = []; 

    var glob = {
        rendered: 0,
        loadNum: 50,
        currPage: 1
    };   

    var currItem = {
        max: 49,
        min: 0,
        id: 0,
        increase: function (num) {
            if (this.id + num > this.max) {return 50;}
            this.id = this.id + num;
            return this.id;
        },
        decrease: function (num) {
            if (this.id - num < this.min) {return -1;}
            this.id = this.id - num;
            return this.id;
        }
    };  

    function listenUser() {
        var showItem = 'pic' + currItem.id;
        markItem(showItem);
        var newShowItem;        

        function markItem(id) {            
            var element = document.getElementById(id);
            element.classList.add('pic-show');
        };

        function demarkItem(id) {            
            var element = document.getElementById(id);
            element.classList.remove('pic-show');
        };

        function chngItemShow() {
            demarkItem(showItem);
            newShowItem = 'pic' + newShowItem;
            markItem(newShowItem);
            showItem = newShowItem;
        };

        function decreaseItem(step) {
            newShowItem = currItem.decrease(step);
            if (newShowItem >= currItem.min) {
                chngItemShow();
            } else {
                if (glob.currPage > 1) {
                    glob.currPage--;
                    getData(glob.currPage, 'back');
                    var checkRender = setInterval(function() {
                        if (glob.rendered) {
                            clearInterval(checkRender);                                                        
                            showItem = 'pic' + currItem.id;
                            newShowItem = 'pic' + currItem.id;
                            markItem(showItem);
                        };
                    }, 1);
                };
            };
        };

        function increaseItem(step) {
            newShowItem = currItem.increase(step);
            if (newShowItem <= currItem.max) {
                chngItemShow();
            } else {
                glob.currPage++;
                getData(glob.currPage, 'fwd');
                var checkRender = setInterval(function() {
                    if (glob.rendered) {
                        clearInterval(checkRender);                                               
                        showItem = 'pic' + currItem.id;
                        newShowItem = 'pic' + currItem.id;
                        markItem(showItem);
                    };
                }, 1);
            };
        };

        document.onkeydown = function(e) {            
            // up
            if (e.keyCode == 38 && glob.rendered) {
                decreaseItem(5);
            };

            if (e.keyCode == 37 && glob.rendered) {
                decreaseItem(1);                
            };

            if (e.keyCode == 39 && glob.rendered) {
                increaseItem(1);                
            };
            // down
            if (e.keyCode == 40 && glob.rendered) {  
                increaseItem(5);
            };
        };

        var timer;  
        var picBlock = document.getElementById('picts');
        picBlock.addEventListener("mousewheel", scrollCheck);

        function scrollCheck(e) {
            e.preventDefault();
            e.stopPropagation();          
            if (timer) { clearTimeout(timer); };
            timer = setTimeout(function () {
                timer = false; 
                if (glob.rendered) {
                    if (e.deltaY > 0) { increaseItem(5); };
                    if (e.deltaY < 0) { decreaseItem(5); };
                };
            }, 100);
        };
    };

    function isNullLoad(number) {
      return number == 0;
    };

    function loadingStart() {
        glob.rendered = 0;
        var inputPlace = document.getElementById('picts');
        var loadPic = document.createElement('img');
        loadPic.setAttribute('id', 'loading');
        loadPic.src = './img/ring-alt.gif';
        inputPlace.appendChild(loadPic); 
    };

    function loadingFinish() {
        var inputPlace = document.getElementById('picts');
        var loadPic = document.getElementById('loading');
        inputPlace.removeChild(loadPic);
    };

    function getData(page, dest) {
        glob.rendered = 0;
        loadingStart();
        var myKey = '3361dcb2564ec86dd8b10ffbe087db86',
            photoNum = ((page-1)*glob.loadNum + 50),
            URL = 'https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key='+myKey+'&per_page='+photoNum+'&media=photos&format=json&nojsoncallback=1';            

        var xhr = new XMLHttpRequest();
        xhr.open('GET', URL, true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=utf-8');
        xhr.send();

        xhr.onreadystatechange = function() {
            if (this.readyState != 4) return false;
            if (this.status != 200) {                
                console.log( 'ошибка: ' + (this.status ? this.statusText : 'запрос не удался') );                
            } else {
                try {
                    var data = JSON.parse(xhr.responseText);                    
                    // Если всего картинок меньше чем запрашиваем - на первую страницу
                    if (data.photos.total < photoNum) { glob.currPage = 1; };
                    getImages(data, glob.currPage);

                    var checkLoad = setInterval(function() {
                        if (loadArrStatus.every(isNullLoad)) {                            
                            clearInterval(checkLoad);                                                       
                            renderBlock(dest);   
                            loadArrStatus = [];
                            glob.loadNum = 40;  // следующие загрузки по 40 картинок
                        };
                    }, 1);
                } catch (e) {                    
                    console.log( "Некорректный ответ " + e.message );
                };
            };
        };
    };

    function getImages(objPic, page) {
        var photos = objPic.photos.photo;
        
        var addStart = page>1 ? 10 : 0;
        var firstPic = (page-1)*glob.loadNum + addStart,     // loadNum на старте - 50
            lastPic = page*glob.loadNum - 1 + addStart;
        
        for (var i = firstPic; i <= lastPic; i++) {
            (function(num, startNum) {
                loadArrStatus[num-startNum] = 1;
                var myresult = photos[num]; 
                var URL = "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=3361dcb2564ec86dd8b10ffbe087db86&photo_id="+myresult.id+"&format=json&nojsoncallback=1";

                var xhr = new XMLHttpRequest();
                xhr.open('GET', URL, true);
                xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=utf-8');
                xhr.send();

                xhr.onreadystatechange = function() {
                    if (this.readyState != 4) return false;
                    if (this.status != 200) {
                        console.log( 'ошибка: ' + (this.status ? this.statusText : 'запрос не удался') );
                        return;
                    } else {
                        try {                                
                            var data = JSON.parse(xhr.responseText);                            
                            fillImageArr(data);
                            data = null;
                            loadArrStatus[num-startNum] = 0;
                        } catch (e) {
                            console.log( "Некорректный ответ " + e.message );
                        };
                    };
                };
            })(i, firstPic);
        };
    };

    function fillImageArr(imgObj) {        
        var imgArr = imgObj.sizes.size;
        imgArr.forEach(function (element) {
            if (element.width==75) {
                imageUrlArr.push(element.source);
            };
        });
    };

    
    function renderBlock(dest) {        
        // window.scrollTo(0, 0);       
       
        function generateLi() {                       
            for (var i = 0; i < glob.loadNum; i++) {
                var ulPlace = document.getElementById('picUl');
                var elem_li = document.createElement('li');                                
                var elem_img = document.createElement('img');

                elem_img.src = imageUrlArr[i];
                elem_img.classList.add('pic-img');
                elem_li.appendChild(elem_img);
                elem_li.classList.add('pic-li');
                if (dest == 'back') {
                    ulPlace.insertBefore(elem_li, ulPlace.children[0]);
                } else {
                    ulPlace.appendChild(elem_li);
                };                                
            };
            loadingFinish();
        };

        function renameLi() {
            var ulPlace = document.getElementById('picUl');
            var liArr = ulPlace.getElementsByClassName('pic-li');
            for (var i =  0; i < liArr.length; i++) {
                liArr[i].setAttribute('id', 'pic'+i);
            };            
        };

        var inputPlace = document.getElementById('picts');
        var pressentBlock = document.getElementById('block');
        
        if (pressentBlock) { 
            // найти существующие картинки
            var ulPlace = document.getElementById('picUl');             
            generateLi();                     
            pressentBlock.className = (dest=='back') ? 'slideDown' : 'slideUp';
            setTimeout(function () {
                // удалить первые/последние 40                
                var addDest = (dest=='back') ? 9 : 0;
                for (var i = 0+addDest; i < glob.loadNum+addDest; i++) {                                       
                    var removeLi = document.getElementById('pic'+i);                        
                    ulPlace.removeChild(removeLi);                    
                };
                
                if (dest == 'fwd') {
                    currItem.id = currItem.id - glob.loadNum;
                };
                if (dest == 'back') {
                    currItem.id = currItem.id + glob.loadNum;
                }; 
                renameLi();
                pressentBlock.className = 'picture';
                glob.rendered = 1;   
            }, 1000);
        } else {
            var newBlock = document.createElement('div');
            newBlock.classList.add('picture');
            newBlock.classList.add('newblock');
            newBlock.setAttribute('id', 'block');
            var newUl = document.createElement('ul');
            newUl.setAttribute('id', 'picUl');
            newUl.classList.add('.pic-ul');
            
            newBlock.appendChild(newUl);
            inputPlace.appendChild(newBlock);

            generateLi();
            renameLi();            

            setTimeout(function () {            
                newBlock.classList.remove('newblock');
                newBlock.classList.add('slideDown');            
                glob.rendered = 1;        
            }, 1000);

            setTimeout(function () {            
                newBlock.classList.remove('slideDown');
            }, 1500);
        };       
        
        // clear URL array
        imageUrlArr = [];        
    };

// загрузить первые данные
    getData(glob.currPage, 'start');
    var checkRender = setInterval(function() {
        if (glob.rendered) {
            clearInterval(checkRender);            
            listenUser();
        };
    }, 1);

})
);