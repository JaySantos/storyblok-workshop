### **Content Model**

* Game
  * `name`: short text
  * `cover`: image
  * `description`: long text
  * `release_date`: date
  * `release_quarter`: list (Q1, Q2, Q3, Q4)
  * `release_year`: number
  * `genre`: reference -> Genre (one)
  * `social_media`: link (many)
  * `studio`: reference -> Studio (many)
  * `store`: link (many)
  * `hwt_producer`: reference -> Person (many)
* Studio
  * `name`: short text
  * `logo`: image
  * `description`: long text
  * `social_media`: link
  * `contact`: link
* Genre
  * `name`: short text
  * `picture`: image
  * `description`: long text
  * `public_examples`: long text
* Person
  * `name`: short text
  * `picture`: image
  * `bio`: long text
  * `social_media`: link (many)
  * `contact`: link
* Platform
  * `name`: short text
  * `logo`: image
