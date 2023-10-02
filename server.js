import express from 'express';

// express app
const app = express()

const port = 8000

// middleware
app.use(express.json())

let totalPoints=0 // total number of points, useful for checks
let tail=null // node with the latest timestamp
let head=null // node with the earliest timestamp

// payerCount keeps track of number of nodes for each payer. Each payer should have at
// least 1 node count. When /spend is called, nodes with payer where payerCount>1 will be 
// removed if the points is reduced to 0. This will ensure that there isn't a bunch of nodes
// with 0 points, maximizing future computational speed.
let payerCount={} 

let payerPoints={} // number of points for each payer

// Node class for the linked list
class Node {
  constructor(payer, points, timestamp) {
    this.payer=payer
    this.points = points
    this.timestamp = timestamp
    this.next = null 
    this.prev = null               
  }
}

app.post('/add', (req, res) => {
  const payer = req.body.payer
  const points = req.body.points
  const timestamp = req.body.timestamp

  // update payerCount and payerPoints
  if (payer in payerCount) {
    payerCount[payer]++
  } else {
    payerCount[payer]=1
  }

  if (payer in payerPoints) {
    payerPoints[payer]+=points
  } else {
    payerPoints[payer]=points
  }

  let node = new Node(payer, points, timestamp)

  if (!head && !tail) {
    // linked list is currently empty
    head=node
    tail=node
  } else if (Date.parse(timestamp)>Date.parse(tail.timestamp)) {
    // this transaction is the latest, append it
    tail.next=node
    node.prev=tail
    tail=node
  } else if (Date.parse(timestamp)<=Date.parse(head.timestamp)) {
    // this transaction is the earliest, insert in front
    node.next=head
    head.prev=node
    head=node
  } else {
    // find position for this transaction to be inserted
    current=head
    while (Date.parse(current.timestamp)<=Date.parse(node.timestamp)) {
      current=current.next
    }

    // link previous node
    prevNode=current.prev
    prevNode.next=node
    node.prev=prevNode

    // link next node
    node.next=current
    current.prev=node
  }

  // update total 
  totalPoints=totalPoints+points
  
  res.status(200).end()
})

app.post('/spend', (req, res) => {
  let points = req.body.points // points to be spent

  if (points>totalPoints) {
    res.status(400).send("User doesn't have enough points!")
    return
  }

  let output = {} // record where the points are being spent on

  let current=head

  // traverse linked list
  while (current && points>0) {
    if (current.points>=points) {
      let remPoints=current.points-points
      current.points=remPoints

      // add to output
      if (current.payer in output) {
        output[current.payer]-=points
      } else {
        output[current.payer]= -points
      }

      // update total
      totalPoints=totalPoints-points
      payerPoints[current.payer]-=points

      points=0 // no more points to be spent
    } else {
      // scenario where after spending this transaction's points, there are still more 
      // points to be spent
      points=points-current.points
      totalPoints=totalPoints-current.points
      payerPoints[current.payer]-=current.points

      // add to output
      if (current.payer in output) {
        output[current.payer]-=current.points
      } else {
        output[current.payer]= -current.points
      }

      if (payerCount[current.payer]>1 && current.prev) {
        // this node's points will be set to 0, remove it as there are other nodes with the same
        // payer and this node is an extra
        payerCount[current.payer]--
        let prevNode=current.prev
        let nextNode=current.next

        current=current.next // move to next node

        // unlink this node
        prevNode.next=nextNode
        nextNode.prev=prevNode

      } else if (payerCount[current.payer]>1 && !current.prev) {
        // same operation as above but this node is the head
        payerCount[current.payer]--
        let nextNode=current.next

        current=current.next

        // unlink
        nextNode.prev=null
        head=nextNode

      } else if (payerCount[current.payer]===1) {
        // Do not remove this node since we also want to keep track of payers that have 0 points
        current.points=0
        current=current.next
      }
    } 
  }

  // reformat output data into a list
  let outputList=[]
  for (const p in output) {
    outputList.push({
      payer: p,
      points: output[p]
    })
  }

  res.status(200).json(outputList)
})

app.get('/balance', (req, res) => {
  res.status(200).json(payerPoints)
})


app.listen(port, () => {
    console.log('listening on port', port)
})
